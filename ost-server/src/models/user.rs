use serde::Serialize;
use sqlx::{query, query_as, FromRow, Pool, Postgres};

use crate::ServerResult;

#[derive(FromRow, Serialize)]
pub struct User {
    pub id: i32,
    pub language: String,
    pub username: String,
}

pub async fn create_or_update(
    database: &Pool<Postgres>,
    id: i32,
    language: String,
    username: String,
) -> ServerResult<()> {
    let mut transaction = database.begin().await?;
    query(r#"DELETE FROM users WHERE username = $1"#)
        .bind(&username)
        .fetch_optional(&mut transaction)
        .await?;
    query(
        r#"INSERT INTO users (id, language, username) VALUES ($1, $2, $3)
                ON CONFLICT (id) DO
                UPDATE SET language = $2, username = $3"#,
    )
    .bind(id)
    .bind(language)
    .bind(username)
    .execute(database)
    .await?;
    transaction.commit().await?;
    Ok(())
}

pub fn parse_country_code(country_code: String) -> String {
    String::from(match country_code.as_str() {
        "AR" | "BO" | "CL" | "CO" | "CR" | "CU" | "DO" | "EC" | "SV" | "GQ" | "GT" | "HN"
        | "MX" | "NI" | "PA" | "PY" | "PR" | "PE" | "ES" | "UY" | "VE" => "es",
        _ => "en",
    })
}

pub async fn retrieve(database: &Pool<Postgres>, username: String) -> ServerResult<Option<User>> {
    Ok(
        query_as::<_, User>(r#"SELECT * FROM users WHERE username = $1"#)
            .bind(username)
            .fetch_optional(database)
            .await?,
    )
}
