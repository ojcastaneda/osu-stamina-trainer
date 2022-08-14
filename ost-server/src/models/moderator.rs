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

pub async fn create(
    database: &Pool<Postgres>,
    password: String,
    username: String,
) -> ServerResult<()> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    query(r#"INSERT INTO moderators (password, username) VALUES ($1, $2)"#)
        .bind(
            argon2
                .hash_password(password.as_bytes(), &salt)?
                .to_string(),
        )
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
    password: String,
    username: String,
) -> ServerResult<Option<Moderator>> {
    if let Some(moderator) =
        query_as::<_, Moderator>(r#"SELECT * FROM moderators WHERE username = $1"#)
            .bind(username)
            .fetch_optional(database)
            .await?
    {
        let password_hash = PasswordHash::new(&moderator.password)?;
        let argon2 = Argon2::default();
        if argon2
            .verify_password(password.as_bytes(), &password_hash)
            .is_ok()
        {
            return Ok(Some(moderator));
        }
    }
    Ok(None)
}

pub async fn update_username(
    database: &Pool<Postgres>,
    id: i32,
    username: String,
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
    password: String,
) -> ServerResult<bool> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let rows = query(r#"UPDATE moderators SET password = $1 WHERE id = $2"#)
        .bind(
            argon2
                .hash_password::<SaltString>(password.as_bytes(), &salt)?
                .to_string(),
        )
        .bind(id)
        .execute(database)
        .await?
        .rows_affected();
    Ok(rows > 0)
}
