use reqwest::{get, Error};
use std::{
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::{sync::Mutex, time::sleep};

#[derive(Clone)]
pub struct Client {
    rate_limiter: Arc<Mutex<Instant>>,
}

impl Client {
    pub async fn download(&mut self, id: i32) -> Result<Option<Vec<u8>>, Error> {
        let mut rate_limiter = self.rate_limiter.lock().await;
        let seconds_elapsed = rate_limiter.elapsed().as_secs_f64();
        if seconds_elapsed < 5.0 {
            sleep(Duration::from_secs_f64(5.0 - seconds_elapsed)).await;
        }
        let request = get(format!("https://osu.ppy.sh/osu/{id}")).await;
        *rate_limiter = Instant::now();
        drop(rate_limiter);
        let file = request?.text().await?;
        Ok(if file.is_empty() {
            None
        } else {
            Some(Vec::from(file.as_bytes()))
        })
    }
}

impl Default for Client {
    fn default() -> Self {
        Self {
            rate_limiter: Arc::new(Mutex::new(Instant::now())),
        }
    }
}
