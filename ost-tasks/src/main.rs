use std::{
    env,
    error::Error,
    io::stdin,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tasks::{
    periodic::{add_beatmaps, check_submissions, process_submissions, synchronize_with_osu_api},
    setup::{setup_files, update_collection},
    Services,
};
use tokio::time::sleep;

mod models;
mod osu_files;
mod tasks;

pub type TaskResult<T> = Result<T, Box<dyn Error + Sync + Send>>;

#[tokio::main]
async fn main() -> TaskResult<()> {
    dotenv::dotenv().ok();
    if env::var("PERIODIC")?.parse()? {
        let starting_time = Instant::now();
        loop {
            let current_time = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis() as i64;
            let services = Services::setup().await?;
            synchronize_with_osu_api(services.clone()).await?;
            add_beatmaps(current_time, services.clone()).await?;
            check_submissions(services.clone()).await?;
            process_submissions(services).await?;
            sleep(
                Duration::from_secs(
                    86_000 - Instant::now().duration_since(starting_time).as_secs() % 86_000,
                ) - starting_time.elapsed(),
            )
            .await;
        }
    } else {
        let current_time = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis() as i64;
        println!("Select the task you want to perform:");
        println!("1: Check files.");
        println!("2: Setup storage.");
        println!("3: Update collection.");
        println!("4: Check files and update collection.");
        println!("5: Full setup.");
        let mut input = String::new();
        stdin().read_line(&mut input)?;
        match input.trim_end() {
            "1" => setup_files(false).await?,
            "2" => setup_files(true).await?,
            "3" => update_collection(current_time, Services::setup().await?).await?,
            "4" => {
                setup_files(false).await?;
                update_collection(current_time, Services::setup().await?).await?
            }
            "5" => {
                setup_files(true).await?;
                update_collection(current_time, Services::setup().await?).await?
            }
            _ => println!("Incorrect input."),
        }
    };
    Ok(())
}
