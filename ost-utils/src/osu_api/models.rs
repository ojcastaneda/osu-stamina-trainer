use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct Beatmap {
    pub beatmapset: Option<Beatmapset>,
    pub beatmapset_id: i32,
    pub checksum: String,
    pub id: i32,
    pub last_updated: DateTime<Utc>,
    pub mode: String,
    pub ranked: i8,
    pub total_length: i16,
    pub version: String,
}

impl Beatmap {
    pub fn is_ranked(&self) -> bool {
        self.ranked == 1 || self.ranked == 2
    }

    pub fn is_loved(&self) -> bool {
        self.ranked == 4
    }

    pub fn is_standard(&self) -> bool {
        self.mode == "osu"
    }
}
#[derive(Deserialize)]
pub struct Beatmaps {
    pub beatmaps: Vec<Beatmap>,
}

#[derive(Deserialize)]
pub struct Beatmapset {
    pub beatmaps: Option<Vec<Beatmap>>,
    pub favourite_count: i32,
    pub id: i32,
    pub play_count: i32,
    pub ranked: i8,
    pub ranked_date: Option<DateTime<Utc>>,
    pub title: String,
}

impl Beatmapset {
    pub fn is_ranked(&self) -> bool {
        self.ranked == 1 || self.ranked == 2
    }

    pub fn is_loved(&self) -> bool {
        self.ranked == 4
    }
}

#[derive(Deserialize)]
pub struct ClientToken {
    pub access_token: String,
    pub expires_in: u64,
    pub token_type: String,
}

#[derive(Deserialize)]
pub struct Cursor {
    pub approved_date: String,
    pub id: String,
}

#[derive(Clone, Serialize)]
pub struct Credentials {
    pub client_id: String,
    pub client_secret: String,
    pub grant_type: String,
    pub scope: String,
}
pub struct Headers {
    pub token: String,
    pub expiration: DateTime<Utc>,
}

impl Headers {
    pub fn new(token: String, expiration: DateTime<Utc>) -> Self {
        Headers { token, expiration }
    }
}

#[derive(Deserialize)]
pub struct LeaderboardBeatmapsets {
    pub beatmapsets: Vec<Beatmapset>,
    pub cursor: Option<Cursor>,
}

#[derive(Deserialize)]
pub struct Token {
    pub access_token: String,
    pub expires_in: u64,
    pub token_type: String,
}

#[derive(Deserialize)]
pub struct User {
    pub country_code: String,
    pub username: String,
}
