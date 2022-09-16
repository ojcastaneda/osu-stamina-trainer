use crate::ServerResult;
use sqlx::{query, Pool, Postgres};

pub async fn record_activity(
    add_unique_user: bool,
    database: &Pool<Postgres>,
    date_id: i32,
) -> ServerResult<()> {
    query(&format!(
        r#"INSERT INTO bot_tracking (date_id, unique_users, interactions) VALUES ($1, 1, 1)
            ON CONFLICT (date_id) DO
            UPDATE SET interactions = bot_tracking.interactions + 1{}
            "#,
        if add_unique_user {
            ", unique_users = bot_tracking.unique_users + 1"
        } else {
            ""
        }
    ))
    .bind(date_id)
    .execute(database)
    .await?;
    Ok(())
}
