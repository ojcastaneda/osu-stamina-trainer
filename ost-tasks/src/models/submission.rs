use sqlx::{query, query_as, types::chrono::Utc, Pool, Postgres, Type};

use super::Submission;
use crate::TaskResult;

#[derive(Type)]
#[sqlx(type_name = "enum_approval_status", rename_all = "snake_case")]
pub enum ApprovalStatus {
    Approved,
    Pending,
    Processing,
}

pub async fn approve(database: &Pool<Postgres>, id: i32) -> TaskResult<()> {
    query(r#"UPDATE submissions SET approval_status = $1 WHERE id = $2"#)
        .bind(ApprovalStatus::Approved)
        .bind(id)
        .execute(database)
        .await?;
    Ok(())
}

pub async fn create_or_update(
    database: &Pool<Postgres>,
    beatmapset_id: i32,
    id: i32,
    title: &str,
) -> TaskResult<()> {
    query(
        r#"INSERT INTO submissions (beatmapset_id, id, title) VALUES ($1, $2, $3)
            ON CONFLICT (id) DO
            UPDATE SET last_updated = $4"#,
    )
    .bind(beatmapset_id)
    .bind(id)
    .bind(title)
    .bind(Utc::now())
    .execute(database)
    .await?;
    Ok(())
}

pub async fn delete(database: &Pool<Postgres>, id: i32) -> TaskResult<()> {
    query(r#"DELETE FROM submissions WHERE id = $1"#)
        .bind(id)
        .execute(database)
        .await?;
    Ok(())
}

pub async fn resubmit(database: &Pool<Postgres>, id: i32, title: &str) -> TaskResult<()> {
    let mut transaction = database.begin().await?;
    query(r#"DELETE FROM beatmaps WHERE id = $1"#)
        .bind(id)
        .execute(&mut transaction)
        .await?;
    query(r#"UPDATE submissions SET approval_status = $1, last_updated = $2, title = $3 WHERE id = $4"#)
        .bind(ApprovalStatus::Pending)
        .bind(Utc::now())
        .bind(title)
        .bind(id)
        .execute(&mut transaction)
        .await?;
    Ok(())
}

pub async fn retrieve_all_processing(database: &Pool<Postgres>) -> TaskResult<Vec<Submission>> {
    Ok(
        query_as::<_, Submission>(r#"SELECT id FROM submissions WHERE approval_status = $1"#)
            .bind(ApprovalStatus::Processing)
            .fetch_all(database)
            .await?,
    )
}
