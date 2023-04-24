use crate::{
    models::{
        beatmap,
        order::OrderOperator,
        submission::{self, ApprovalStatus},
        unchecked_submission,
    },
    ServerResult,
};
use axum::{
    extract::Path,
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, post},
    Extension, Json, Router,
};
use ost_utils::storage;
use serde::Deserialize;
use sqlx::{Pool, Postgres};

use super::authentication::Session;

#[derive(Deserialize)]
pub struct SubmissionsByPageFilters {
    pub filter: Option<ApprovalStatus>,
    pub order: OrderOperator,
    pub title: Option<String>,
}

async fn approve(
    Extension(database): Extension<Pool<Postgres>>,
    Path(id): Path<i32>,
    _: Session,
) -> ServerResult<impl IntoResponse> {
    if submission::approve(&database, id).await? {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Ok(StatusCode::NOT_FOUND)
    }
}

async fn create(
    Extension(database): Extension<Pool<Postgres>>,
    Path(id): Path<i32>,
) -> ServerResult<impl IntoResponse> {
    if id.is_positive() && beatmap::retrieve(&database, id).await?.is_some() {
        return Ok((
            StatusCode::CONFLICT,
            "This beatmap is already part of the collection.",
        ));
    }
    unchecked_submission::create(&database, id).await?;
    Ok((StatusCode::NO_CONTENT, ""))
}

async fn remove(
    Extension(database): Extension<Pool<Postgres>>,
    Extension(storage): Extension<storage::Client>,
    Path(id): Path<i32>,
    _: Session,
) -> ServerResult<impl IntoResponse> {
    if submission::delete(&database, id).await? {
        storage.delete(format!("beatmaps/{id}.osu")).await?;
        Ok(StatusCode::NO_CONTENT)
    } else {
        Ok(StatusCode::NOT_FOUND)
    }
}

async fn retrieve_by_page(
    Extension(database): Extension<Pool<Postgres>>,
    Path(page): Path<i32>,
    _: Session,
    Json(payload): Json<SubmissionsByPageFilters>,
) -> ServerResult<impl IntoResponse> {
    Ok((
        StatusCode::OK,
        Json(
            submission::retrieve_by_page(
                &database,
                payload.filter,
                payload.order,
                page,
                payload.title,
            )
            .await?,
        ),
    ))
}

pub fn submission_routes() -> Router {
    Router::new()
        .route("/:id", post(create))
        .route("/:id", delete(remove))
        .route("/:id/approve", post(approve))
        .route("/page/:page", post(retrieve_by_page))
}
