use sqlx::FromRow;

pub mod beatmap;
pub mod submission;
pub mod unchecked_submission;

#[derive(FromRow)]
pub struct Submission {
    pub id: i32,
}
