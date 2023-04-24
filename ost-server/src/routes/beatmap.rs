use axum::{
    extract::Path, http::StatusCode, response::IntoResponse, routing::post, Extension, Json, Router,
};
use serde::Deserialize;
use sqlx::{Pool, Postgres};

use crate::{
    collection_generator::generate_collection_file,
    models::{beatmap, filter::Filter, order::Order},
    ServerResult,
};

#[derive(Deserialize)]
pub struct BeatmapsByPageFilters {
    pub filters: Vec<Filter>,
    pub order: Order,
    pub title: Option<String>,
}

#[derive(Deserialize)]
pub struct BeatmapsCollectionFilters {
    pub filters: Vec<Filter>,
    pub title: Option<String>,
    pub use_bpm_division: bool,
    pub use_osdb_format: bool,
}

async fn retrieve_by_page(
    Extension(database): Extension<Pool<Postgres>>,
    Path(page): Path<i32>,
    Json(payload): Json<BeatmapsByPageFilters>,
) -> ServerResult<impl IntoResponse> {
    Ok((
        StatusCode::OK,
        Json(
            beatmap::retrieve_by_page(
                &database,
                &payload.filters,
                payload.order,
                page,
                payload.title,
            )
            .await?,
        ),
    ))
}

async fn retrieve_collection_file(
    Extension(database): Extension<Pool<Postgres>>,
    Json(payload): Json<BeatmapsCollectionFilters>,
) -> ServerResult<impl IntoResponse> {
    Ok((
        StatusCode::OK,
        generate_collection_file(
            beatmap::retrieve_filtered_collection(&database, &payload.filters, payload.title)
                .await?,
            payload.use_bpm_division,
            payload.use_osdb_format,
        )
        .await?,
    ))
}

pub fn beatmap_routes() -> Router {
    Router::new()
        .route("/collection", post(retrieve_collection_file))
        .route("/page/:page", post(retrieve_by_page))
}
