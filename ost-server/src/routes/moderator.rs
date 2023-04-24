use axum::{http::StatusCode, response::IntoResponse, routing::post, Extension, Json, Router};
use serde::Deserialize;
use sqlx::{Pool, Postgres};

use crate::{models::moderator, ServerResult};

use super::authentication::Session;

#[derive(Deserialize)]
struct Moderator {
    password: String,
    username: String,
}

async fn create(
    Extension(database): Extension<Pool<Postgres>>,
    _: Session,
    Json(payload): Json<Moderator>,
) -> ServerResult<impl IntoResponse> {
    moderator::create(&database, &payload.password, &payload.username).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
struct Credentials {
    credentials: String,
}

async fn update_password(
    Extension(database): Extension<Pool<Postgres>>,
    session: Session,
    Json(payload): Json<Credentials>,
) -> ServerResult<impl IntoResponse> {
    if moderator::update_password(&database, session.id, &payload.credentials).await? {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Ok(StatusCode::NOT_FOUND)
    }
}

async fn update_username(
    Extension(database): Extension<Pool<Postgres>>,
    session: Session,
    Json(payload): Json<Credentials>,
) -> ServerResult<impl IntoResponse> {
    if moderator::update_username(&database, session.id, &payload.credentials).await? {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Ok(StatusCode::NOT_FOUND)
    }
}

pub fn moderator_routes() -> Router {
    Router::new()
        .route("/", post(create))
        .route("/password", post(update_password))
        .route("/username", post(update_username))
}
