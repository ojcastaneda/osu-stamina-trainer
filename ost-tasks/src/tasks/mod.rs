use crate::{models::beatmap, osu_files, TaskResult};
use ost_utils::{
    beatmaps_processor::process_beatmap,
    osu_api::{self, models::Beatmap},
    storage,
};
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use std::{env, future::Future};
use tokio::{spawn, task::JoinHandle};

pub mod periodic;
pub mod setup;

const REQUESTS_RATE: usize = 300;
const THREADS: usize = 64;

#[derive(Clone)]
pub struct Services {
    pub database: Pool<Postgres>,
    pub storage: storage::Client,
    pub osu_api: osu_api::Client,
    pub osu_files: osu_files::Client,
}

impl Services {
    pub async fn setup() -> TaskResult<Self> {
        Ok(Self {
            database: PgPoolOptions::new()
                .connect(&env::var("DATABASE_URL")?)
                .await?,
            storage: storage::Client::from_environment().await?,
            osu_api: osu_api::Client::from_environment(REQUESTS_RATE)?,
            osu_files: osu_files::Client::default(),
        })
    }
}

pub struct Tasks<T> {
    current: usize,
    limit: usize,
    tasks: Vec<JoinHandle<TaskResult<T>>>,
    unit: Option<&'static str>,
}

impl<T> Tasks<T>
where
    T: 'static + Send,
{
    async fn join(&mut self) -> TaskResult<Vec<T>> {
        let mut results = Vec::with_capacity(self.tasks.len());
        for task in self.tasks.drain(0..) {
            results.push(task.await??);
        }
        Ok(results)
    }

    pub fn log(&self) {
        if self.unit.is_some() {
            println!(
                "{:.2}% {}.",
                100.0 * self.current as f64 / self.limit as f64,
                self.unit.unwrap()
            );
        }
    }

    pub fn new(capacity: usize, limit: usize, unit: Option<&'static str>) -> Self {
        Self {
            current: 0,
            limit,
            tasks: Vec::with_capacity(capacity),
            unit,
        }
    }

    pub async fn spawn<Task: Future<Output = TaskResult<T>> + Send + 'static>(
        &mut self,
        task: Task,
    ) -> TaskResult<Option<Vec<T>>> {
        self.tasks.push(spawn::<Task>(task));
        self.current += 1;
        if self.tasks.len() == self.tasks.capacity() || self.current == self.limit {
            let results = self.join().await?;
            self.log();
            return Ok(Some(results));
        }
        Ok(None)
    }
}

pub async fn create_beatmap(
    beatmap: &Beatmap,
    database: &Pool<Postgres>,
    file: &[u8],
) -> TaskResult<bool> {
    let statistics = process_beatmap(file).await?;
    if statistics.streams_density < 0.25 || statistics.bpm.no_modification < 100 {
        return Ok(false);
    }
    let (no_modification, double_time) = beatmap::parse_beatmap(beatmap, statistics);
    beatmap::create_or_update(database, no_modification, double_time).await?;
    Ok(true)
}

pub fn log_date_progress(current: i64, limit: i64, start: i64, unit: &'static str) {
    println!(
        "{:.2}% {unit}.",
        100.0 * (current - start) as f64 / (limit - start) as f64
    );
}
