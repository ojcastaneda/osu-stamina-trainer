use serde::Serialize;
use sqlx::FromRow;

pub mod beatmap;
pub mod filter;
pub mod moderator;
pub mod order;
pub mod submission;
pub mod tracking;
pub mod unchecked_submission;
pub mod user;

#[derive(FromRow, Serialize)]
pub struct Limit {
    limit: i64,
}
