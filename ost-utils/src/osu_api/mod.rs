mod error;
pub mod models;

use self::models::{
    Beatmap, Beatmaps, Beatmapset, Credentials, Headers, LeaderboardBeatmapsets, Token, User,
};
use base64::encode;
use chrono::Utc;
use std::{
    cmp::{max, min},
    collections::VecDeque,
    env,
    fmt::Display,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::{
    sync::{Mutex, Semaphore},
    time::sleep,
};

pub type Error = error::Error;

pub const IDS_LIMIT: usize = 50;

#[derive(Clone)]
pub struct Client {
    client: reqwest::Client,
    credentials: Credentials,
    headers: Arc<Mutex<Headers>>,
    rate_limiter: Arc<Semaphore>,
    request_queue: Arc<Mutex<VecDeque<Instant>>>,
}

impl Client {
    async fn drop_permit(&self) -> Result<(), Error> {
        self.request_queue.lock().await.push_front(Instant::now());
        self.rate_limiter.add_permits(1);
        Ok(())
    }

    fn filter_beatmaps(beatmaps: &mut Vec<Beatmap>, beatmapset: Beatmapset) {
        for beatmap in beatmapset.beatmaps.unwrap() {
            if beatmap.mode != "osu" {
                continue;
            }
            beatmaps.push(Beatmap {
                id: beatmap.id,
                beatmapset: Some(Beatmapset {
                    id: beatmapset.id,
                    beatmaps: None,
                    favourite_count: beatmapset.favourite_count,
                    play_count: beatmapset.play_count,
                    ranked: beatmapset.ranked,
                    ranked_date: beatmapset.ranked_date,
                    title: beatmapset.title.clone(),
                }),
                beatmapset_id: beatmap.beatmapset_id,
                checksum: beatmap.checksum,
                total_length: beatmap.total_length,
                last_updated: beatmap.last_updated,
                mode: beatmap.mode,
                ranked: beatmap.ranked,
                version: beatmap.version,
            });
        }
    }

    pub fn from_environment(requests_per_minute: usize) -> Result<Self, Error> {
        let requests_rate = max(min(requests_per_minute, 1000), 1);
        let mut request_queue = VecDeque::<Instant>::with_capacity(requests_rate);
        let starting_instant = Instant::now() - Duration::from_secs(60);
        for _ in 0..requests_rate {
            request_queue.push_front(starting_instant);
        }
        Ok(Self {
            client: reqwest::Client::new(),
            credentials: Credentials {
                client_id: env::var("OSU_API_CLIENT_ID")?,
                client_secret: env::var("OSU_API_CLIENT_SECRET")?,
                grant_type: String::from("client_credentials"),
                scope: String::from("public"),
            },
            headers: Arc::new(Mutex::new(Headers::new(String::default(), Utc::now()))),
            rate_limiter: Arc::new(Semaphore::new(requests_rate)),
            request_queue: Arc::new(Mutex::new(request_queue)),
        })
    }

    async fn refresh_token(&mut self) -> Result<(), Error> {
        let mut headers = self.headers.lock().await;
        if Utc::now() < headers.expiration {
            return Ok(());
        }
        let response = self
            .client
            .post("https://osu.ppy.sh/oauth/token")
            .json(&self.credentials)
            .send()
            .await?;
        let token = response.json::<Token>().await?;
        *headers = Headers::new(
            format!("{} {}", token.token_type, token.access_token),
            Utc::now() + chrono::Duration::seconds((token.expires_in - 900) as i64),
        );
        Ok(())
    }

    pub async fn retrieve_beatmap(&mut self, id: i32) -> Result<Option<Beatmap>, Error> {
        self.request_permit().await?;
        let token = self.headers.lock().await.token.clone();
        let response = self
            .client
            .get(format!("https://osu.ppy.sh/api/v2/beatmaps/{id}"))
            .header("Authorization", token)
            .send()
            .await;
        self.drop_permit().await?;
        let beatmap = response?;
        if beatmap.status() == 404 {
            return Ok(None);
        }
        Ok(Some(beatmap.json::<Beatmap>().await?))
    }

    pub async fn retrieve_beatmaps(&mut self, ids: &[i32]) -> Result<Vec<Beatmap>, Error> {
        let mut query_string = Vec::with_capacity(ids.len());
        for id in ids {
            query_string.push(format!("ids[]={id}"))
        }
        self.request_permit().await?;
        let token = self.headers.lock().await.token.clone();
        let response = self
            .client
            .get(format!(
                "https://osu.ppy.sh/api/v2/beatmaps?{}",
                query_string.join("&")
            ))
            .header("Authorization", token)
            .send()
            .await;
        self.drop_permit().await?;
        Ok(response?.json::<Beatmaps>().await?.beatmaps)
    }

    pub async fn retrieve_beatmapset(
        &mut self,
        id: impl Display,
    ) -> Result<Option<Beatmapset>, Error> {
        self.request_permit().await?;
        let token = self.headers.lock().await.token.clone();
        let response = self
            .client
            .get(format!("https://osu.ppy.sh/api/v2/beatmapsets/{id}"))
            .header("Authorization", token)
            .send()
            .await;
        self.drop_permit().await?;
        let beatmapset = response?;
        if beatmapset.status() == 404 {
            return Ok(None);
        }
        Ok(Some(beatmapset.json::<Beatmapset>().await?))
    }

    pub async fn retrieve_leaderboard_beatmaps(
        &mut self,
        approved_date: i64,
        id: i32,
        limit_date: i64,
    ) -> Result<(Vec<Beatmap>, i64, i32), Error> {
        if approved_date >= limit_date {
            return Ok((Vec::new(), approved_date, id));
        }
        let cursor_string = encode(format!(
            r#"{{"approved_date":"{approved_date}","id":"{id}"}}"#
        ));
        self.request_permit().await?;
        let token = self.headers.lock().await.token.clone();
        let response = self
            .client
            .get(format!("https://osu.ppy.sh/api/v2/beatmapsets/search?m=0&nsfw=true&sort=ranked_asc&cursor_string={cursor_string}"))
            .header("Authorization", token).send().await;
        self.drop_permit().await?;
        let ranked_beatmaps = response?.json::<LeaderboardBeatmapsets>().await?;
        let mut beatmaps = Vec::<Beatmap>::new();
        let (mut new_approved_date, mut new_id) = if let Some(new_cursor) = ranked_beatmaps.cursor {
            (new_cursor.approved_date.parse()?, new_cursor.id.parse()?)
        } else {
            (limit_date, id)
        };
        for beatmapset in ranked_beatmaps.beatmapsets {
            let ranked_date = beatmapset.ranked_date.unwrap();
            let approved_date = ranked_date.timestamp_millis();
            if approved_date <= limit_date {
                (new_approved_date, new_id) = (approved_date, beatmapset.id);
                Self::filter_beatmaps(&mut beatmaps, beatmapset);
            }
        }
        Ok((beatmaps, new_approved_date, new_id))
    }

    pub async fn retrieve_user(
        &mut self,
        user: impl Display,
        is_username: bool,
    ) -> Result<Option<User>, Error> {
        self.request_permit().await?;
        let token = self.headers.lock().await.token.clone();
        let response = self
            .client
            .get(format!(
                "https://osu.ppy.sh/api/v2/users/{user}?key={}",
                if is_username { "username" } else { "id" }
            ))
            .header("Authorization", token)
            .send()
            .await;
        self.drop_permit().await?;
        let user = response?;
        if user.status() == 404 {
            return Ok(None);
        }
        Ok(Some(user.json::<User>().await?))
    }

    async fn request_permit(&mut self) -> Result<(), Error> {
        self.rate_limiter.clone().acquire_owned().await?.forget();
        self.refresh_token().await?;
        let seconds_elapsed = self
            .request_queue
            .lock()
            .await
            .pop_back()
            .unwrap()
            .elapsed()
            .as_secs_f64();
        if seconds_elapsed < 60.0 {
            sleep(Duration::from_secs_f64(60.0 - seconds_elapsed)).await;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::Client;
    use chrono::{DateTime, Utc};
    use dotenv::dotenv;
    use std::{error::Error, str::FromStr, time::Instant};
    use tokio::spawn;

    fn setup_test(requests_per_minute: usize) -> Result<Client, Box<dyn Error>> {
        dotenv().ok();
        Ok(Client::from_environment(requests_per_minute)?)
    }

    #[tokio::test]
    async fn test_retrieve_beatmap() -> Result<(), Box<dyn Error>> {
        let mut client = setup_test(2)?;
        let beatmap = client.retrieve_beatmap(555797).await?.unwrap();
        assert_eq!(beatmap.beatmapset_id, 158023);
        assert_eq!(beatmap.checksum, "a84050da9b68ca1bd8e2d1700b9c6ca5");
        assert_eq!(beatmap.id, 555797);
        assert_eq!(
            beatmap.last_updated,
            DateTime::<Utc>::from_str("2015-03-17T22:31:07+00:00")?
        );
        assert_eq!(beatmap.mode, "osu");
        assert_eq!(beatmap.ranked, 1);
        assert_eq!(beatmap.total_length, 194);
        assert_eq!(beatmap.version, "Time Freeze");
        let beatmapset = beatmap.beatmapset.unwrap();
        assert!(beatmapset.beatmaps.is_none());
        assert!(beatmapset.favourite_count > 21000);
        assert_eq!(beatmapset.id, 158023);
        assert!(beatmapset.play_count > 47000000);
        assert_eq!(
            beatmapset.ranked_date.unwrap(),
            DateTime::<Utc>::from_str("2015-03-24T22:40:14+00:00")?
        );
        assert_eq!(beatmapset.title, "Everything will freeze");
        assert!(client.retrieve_beatmap(1).await?.is_none());
        Ok(())
    }

    #[tokio::test]
    async fn test_retrieve_beatmapset() -> Result<(), Box<dyn Error>> {
        let mut client = setup_test(2)?;
        let beatmapset = client.retrieve_beatmapset(158023).await?.unwrap();
        assert!(beatmapset.favourite_count > 21000);
        assert_eq!(beatmapset.id, 158023);
        assert!(beatmapset.play_count > 47000000);
        assert_eq!(
            beatmapset.ranked_date.unwrap(),
            DateTime::<Utc>::from_str("2015-03-24T22:40:14+00:00")?
        );
        assert_eq!(beatmapset.title, "Everything will freeze");
        let beatmaps = beatmapset.beatmaps.unwrap();
        assert_eq!(beatmaps.len(), 6);
        let beatmap = beatmaps.get(5).unwrap();
        assert!(beatmap.beatmapset.is_none());
        assert_eq!(beatmap.beatmapset_id, 158023);
        assert_eq!(beatmap.checksum, "a84050da9b68ca1bd8e2d1700b9c6ca5");
        assert_eq!(beatmap.total_length, 194);
        assert_eq!(beatmap.id, 555797);
        assert_eq!(
            beatmap.last_updated,
            DateTime::<Utc>::from_str("2015-03-17T22:31:07+00:00")?
        );
        assert_eq!(beatmap.mode, "osu");
        assert_eq!(beatmap.ranked, 1);
        assert_eq!(beatmap.version, "Time Freeze");
        assert!(client.retrieve_beatmapset(121252).await?.is_none());
        Ok(())
    }

    #[tokio::test]
    async fn test_retrieve_leaderboard_beatmaps() -> Result<(), Box<dyn Error>> {
        let mut client = setup_test(2)?;
        let (beatmaps, approved_date, id) =
            client.retrieve_leaderboard_beatmaps(0, 0, i64::MAX).await?;
        assert_eq!(beatmaps.len(), 70);
        let beatmap = &beatmaps[0];
        assert_eq!(beatmap.beatmapset_id, 1);
        assert_eq!(beatmap.checksum, "a5b99395a42bd55bc5eb1d2411cbdf8b");
        assert_eq!(beatmap.total_length, 142);
        assert_eq!(beatmap.id, 75);
        assert_eq!(
            beatmap.last_updated,
            DateTime::<Utc>::from_str("2014-05-18T17:16:42+00:00")?
        );
        assert_eq!(beatmap.mode, "osu");
        assert_eq!(beatmap.ranked, 1);
        assert_eq!(beatmap.version, "Normal");
        let beatmapset = beatmap.beatmapset.as_ref().unwrap();
        assert!(beatmapset.beatmaps.is_none());
        assert!(beatmapset.favourite_count > 1100);
        assert_eq!(beatmapset.id, 1);
        assert!(beatmapset.play_count > 580000);
        assert_eq!(
            beatmapset.ranked_date.unwrap(),
            DateTime::<Utc>::from_str("2007-10-06T17:46:31+00:00")?
        );
        assert_eq!(beatmapset.title, "DISCO PRINCE");
        assert_eq!(approved_date, 1192064884000);
        assert_eq!(id, 74);
        let (empty_beatmaps, empty_approved_date, empty_id) = client
            .retrieve_leaderboard_beatmaps(i64::MAX, i32::MAX, i64::MAX)
            .await?;
        assert_eq!(empty_beatmaps.len(), 0);
        assert_eq!(empty_approved_date, i64::MAX);
        assert_eq!(empty_id, i32::MAX);
        Ok(())
    }

    #[tokio::test]
    async fn test_requests_per_minute() -> Result<(), Box<dyn Error>> {
        let client = setup_test(2)?;
        let mut tasks = Vec::new();
        let start = Instant::now();
        for _ in 0..3 {
            let mut clone = client.clone();
            tasks.push(spawn(async move {
                clone.retrieve_user(6484647, false).await.unwrap_or(None)
            }));
        }

        for task in tasks {
            assert!(task.await?.is_some());
        }
        assert!(start.elapsed().as_secs_f64() >= 60.0);
        Ok(())
    }

    #[tokio::test]
    async fn test_retrieve_user() -> Result<(), Box<dyn Error>> {
        let mut client = setup_test(2)?;
        assert_eq!(
            client
                .retrieve_user(6484647, false)
                .await?
                .unwrap()
                .username,
            "Sombrax79"
        );
        assert_eq!(
            client
                .retrieve_user("Sombrax79", true)
                .await?
                .unwrap()
                .username,
            "Sombrax79"
        );
        assert!(client.retrieve_user(6484647, true).await?.is_none());
        assert!(client.retrieve_user("Sombrax79", false).await?.is_none());
        Ok(())
    }
}
