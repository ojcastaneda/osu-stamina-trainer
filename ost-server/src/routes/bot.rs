use std::collections::HashMap;

use crate::{
    models::{
        beatmap::{self, Beatmap, RankedStatus},
        filter::Filter,
        tracking::record_activity,
        user::{self, parse_country_code},
    },
    ServerResult,
};
use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Extension, Json, Router,
};
use chrono::{Datelike, Utc};
use ost_utils::{beatmaps_processor::process_beatmap, osu_api, storage};
use redis::{aio::ConnectionManager, AsyncCommands};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres};

const LANGUAGE_CACHE_EXPIRATION: usize = 14_400;
const TRACKING_CACHE_EXPIRATION: usize = 86_400;

async fn request_beatmap(
    Extension(database): Extension<Pool<Postgres>>,
    Query(parameters): Query<HashMap<String, String>>,
    Json(payload): Json<Vec<Filter>>,
) -> ServerResult<impl IntoResponse> {
    if let Some(beatmap) = beatmap::retrieve_request(
        &database,
        &payload,
        parameters.get("use_double_time").unwrap_or(&String::new()) == &String::from("true"),
    )
    .await?
    {
        Ok(Json(beatmap).into_response())
    } else {
        Ok(StatusCode::NOT_FOUND.into_response())
    }
}

#[derive(Serialize)]
pub struct SimpleBeatmap {
    bpm: i16,
    longest_stream: i16,
    performance_100: i16,
    performance_95: i16,
    streams_density: f32,
    streams_length: i16,
    streams_spacing: f32,
}

async fn retrieve_beatmap(
    Extension(database): Extension<Pool<Postgres>>,
    Extension(storage): Extension<storage::Client>,
    Path(id): Path<i32>,
) -> ServerResult<impl IntoResponse> {
    if let Some(beatmap) = beatmap::retrieve(&database, id).await? {
        Ok(Json(beatmap).into_response())
    } else if let Ok(file) = storage.retrieve(format!("beatmaps/{id}.osu")).await {
        let beatmap = process_beatmap(&file).await?;
        let beatmap_file =
            String::from_utf8(file).map_err(|_| storage::Error::GetObject(String::new()))?;
        let mut title = None;
        let mut version = None;
        for line in beatmap_file.lines() {
            if title.is_some() && version.is_some() {
                break;
            }
            if line.starts_with("Title:") {
                title = Some(String::from(line.split_once(':').unwrap().1))
            }
            if line.starts_with("Version:") {
                version = Some(String::from(line.split_once(':').unwrap().1))
            }
        }
        Ok(Json(Beatmap {
            accuracy: beatmap.accuracy.no_modification,
            approach_rate: beatmap.approach_rate.no_modification,
            bpm: beatmap.bpm.no_modification,
            circle_size: beatmap.circle_size,
            difficulty_rating: beatmap.difficulty_rating.no_modification,
            id,
            length: beatmap.total_length,
            longest_stream: beatmap.longest_stream,
            performance_100: beatmap.performance_100.no_modification,
            performance_95: beatmap.performance_95.no_modification,
            ranked_status: RankedStatus::Ranked,
            streams_density: beatmap.streams_density,
            streams_length: beatmap.streams_length,
            streams_spacing: beatmap.streams_spacing,
            title: format!(
                "{} [{}]",
                title.unwrap_or_default(),
                version.unwrap_or_default()
            ),
        })
        .into_response())
    } else {
        Ok(StatusCode::NOT_FOUND.into_response())
    }
}

async fn retrieve_language(
    Extension(mut cache): Extension<ConnectionManager>,
    Extension(database): Extension<Pool<Postgres>>,
    Extension(mut osu_api): Extension<osu_api::Client>,
    Path(username): Path<String>,
) -> ServerResult<impl IntoResponse> {
    let date = Utc::now().date_naive();
    let date_id = (date.year() * 10000) + (date.month() as i32 * 100) + date.day() as i32;
    track_activity(&mut cache, &database, date_id, username.clone()).await?;
    if let Ok(language) = cache.get::<String, String>(username.clone()).await {
        Ok(language)
    } else if let Some(user) = user::retrieve(&database, username.clone()).await? {
        cache
            .set_ex(username, user.language.clone(), LANGUAGE_CACHE_EXPIRATION)
            .await?;
        Ok(user.language)
    } else {
        let language = if let Some(user) = osu_api.retrieve_user(username.clone(), true).await? {
            parse_country_code(user.country_code)
        } else {
            String::from("en")
        };
        cache
            .set_ex(username, language.clone(), LANGUAGE_CACHE_EXPIRATION)
            .await?;
        Ok(language)
    }
}

async fn track_activity(
    cache: &mut ConnectionManager,
    database: &Pool<Postgres>,
    date_id: i32,
    username: String,
) -> ServerResult<()> {
    let mut add_unique_user = true;
    let tracking_username = format!("{username} tracking");
    if let Ok(user_date_id) = cache.get::<String, i32>(tracking_username.clone()).await {
        add_unique_user = user_date_id < date_id;
    }
    cache
        .set_ex(tracking_username, date_id, TRACKING_CACHE_EXPIRATION)
        .await?;
    record_activity(add_unique_user, database, date_id).await?;
    Ok(())
}

#[derive(Deserialize)]
pub struct UserLanguage {
    pub id: i32,
    pub language: String,
}

async fn update_language(
    Extension(mut cache): Extension<ConnectionManager>,
    Extension(database): Extension<Pool<Postgres>>,
    Extension(mut osu_api): Extension<osu_api::Client>,
    Path(username): Path<String>,
    Json(payload): Json<UserLanguage>,
) -> ServerResult<impl IntoResponse> {
    if let Some(user) = osu_api.retrieve_user(payload.id, false).await? {
        let new_username = user.username.replace(' ', "_");
        if new_username != username {
            return Ok(StatusCode::FORBIDDEN);
        }
        user::create_or_update(
            &database,
            payload.id,
            payload.language.clone(),
            new_username.clone(),
        )
        .await?;
        cache
            .set_ex(new_username, payload.language, LANGUAGE_CACHE_EXPIRATION)
            .await?;
        Ok(StatusCode::NO_CONTENT)
    } else {
        Ok(StatusCode::NOT_FOUND)
    }
}

pub fn bot_routes() -> Router {
    Router::new()
        .route("/beatmap/:id", get(retrieve_beatmap))
        .route("/user/:username", get(retrieve_language))
        .route("/beatmap/request", post(request_beatmap))
        .route("/user/:username", post(update_language))
}
