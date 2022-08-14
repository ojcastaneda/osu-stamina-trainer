use super::{Client, Error};
use serde::{Deserialize, Serialize};

const CURSOR_FILE: &str = "cursor.json";

#[derive(Deserialize, Serialize)]
pub struct Cursor {
    pub approved_date: i64,
    pub id: i32,
}

impl Cursor {
    pub fn new(approved_date: i64, id: i32) -> Self {
        Self { approved_date, id }
    }

    pub async fn retrieve(file_storage: &Client) -> Result<Self, Error> {
        if let Ok(file) = file_storage.retrieve(CURSOR_FILE).await {
            Ok(serde_json::from_slice::<Self>(&file)?)
        } else {
            Ok(Self::new(0, 0))
        }
    }

    pub async fn update(&self, file_storage: &Client) -> Result<(), Error> {
        file_storage
            .upload(&serde_json::to_vec(self)?, CURSOR_FILE)
            .await?;
        Ok(())
    }
}
