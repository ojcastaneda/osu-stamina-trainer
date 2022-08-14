use sqlx::{query, Pool, Postgres};

use crate::ServerResult;

pub async fn create(database: &Pool<Postgres>, id: i32) -> ServerResult<()> {
    query(
        r#"INSERT INTO unchecked_submissions (id) VALUES ($1)
            ON CONFLICT (id) DO NOTHING"#,
    )
    .bind(id)
    .execute(database)
    .await?;
    Ok(())
}
