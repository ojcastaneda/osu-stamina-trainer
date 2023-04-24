use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use serde::{Deserialize, Serialize};
use sqlx::{query, query_as, FromRow, Pool, Postgres};

use crate::ServerResult;

#[derive(Deserialize, FromRow, Serialize)]
pub struct Moderator {
    pub id: i32,
    pub password: String,
    pub username: String,
}

pub fn check_password(encrypted_password: &str, password: &str) -> ServerResult<()> {
    Argon2::default()
        .verify_password(password.as_bytes(), &PasswordHash::new(encrypted_password)?)?;
    Ok(())
}

pub fn encrypt_password(password: &str) -> ServerResult<String> {
    Ok(Argon2::default()
        .hash_password(password.as_bytes(), &SaltString::generate(&mut OsRng))?
        .to_string())
}

pub async fn create(database: &Pool<Postgres>, password: &str, username: &str) -> ServerResult<()> {
    query(r#"INSERT INTO moderators (password, username) VALUES ($1, $2)"#)
        .bind(encrypt_password(password)?)
        .bind(username)
        .execute(database)
        .await?;
    Ok(())
}

pub async fn retrieve(database: &Pool<Postgres>, id: i32) -> ServerResult<Option<Moderator>> {
    Ok(
        query_as::<_, Moderator>(r#"SELECT * FROM moderators WHERE id = $1"#)
            .bind(id)
            .fetch_optional(database)
            .await?,
    )
}

pub async fn retrieve_from_credentials(
    database: &Pool<Postgres>,
    password: &str,
    username: &str,
) -> ServerResult<Option<Moderator>> {
    if let Some(moderator) =
        query_as::<_, Moderator>(r#"SELECT * FROM moderators WHERE username = $1"#)
            .bind(username)
            .fetch_optional(database)
            .await?
    {
        if check_password(&moderator.password, password).is_ok() {
            return Ok(Some(moderator));
        }
    }
    Ok(None)
}

pub async fn update_username(
    database: &Pool<Postgres>,
    id: i32,
    username: &str,
) -> ServerResult<bool> {
    let rows = query(r#"UPDATE moderators SET username = $1 WHERE id = $2"#)
        .bind(username)
        .bind(id)
        .execute(database)
        .await?
        .rows_affected();
    Ok(rows > 0)
}

pub async fn update_password(
    database: &Pool<Postgres>,
    id: i32,
    password: &str,
) -> ServerResult<bool> {
    let rows = query(r#"UPDATE moderators SET password = $1 WHERE id = $2"#)
        .bind(encrypt_password(password)?)
        .bind(id)
        .execute(database)
        .await?
        .rows_affected();
    Ok(rows > 0)
}
