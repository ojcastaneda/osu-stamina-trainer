use super::{filter::Filter, order::Order, Limit};
use crate::{collection_generator::CollectionBeatmap, ServerResult};
use serde::{Deserialize, Serialize};
use sqlx::{
    query_as,
    types::chrono::{DateTime, Utc},
    FromRow, Pool, Postgres, Type,
};

#[derive(FromRow, Serialize)]
pub struct Beatmap {
    pub accuracy: f32,
    pub approach_rate: f32,
    pub bpm: i16,
    pub circle_size: f32,
    pub difficulty_rating: f32,
    pub id: i32,
    pub length: i16,
    pub longest_stream: i16,
    pub performance_100: i16,
    pub performance_95: i16,
    pub ranked_status: RankedStatus,
    pub streams_density: f32,
    pub streams_length: i16,
    pub streams_spacing: f32,
    pub title: String,
}

#[derive(FromRow, Serialize)]
pub struct BeatmapByPage {
    pub accuracy: f32,
    pub approach_rate: f32,
    pub beatmapset_id: i32,
    pub bpm: i16,
    pub circle_size: f32,
    pub difficulty_rating: f32,
    pub favorite_count: i32,
    pub id: i32,
    pub last_updated: DateTime<Utc>,
    pub length: i16,
    pub longest_stream: i16,
    pub performance_100: i16,
    pub performance_95: i16,
    pub play_count: i32,
    pub ranked_status: RankedStatus,
    pub streams_density: f32,
    pub streams_length: i16,
    pub streams_spacing: f32,
    pub title: String,
}

#[derive(Serialize)]
pub struct BeatmapPagination {
    pub limit: i64,
    pub beatmaps: Vec<BeatmapByPage>,
}

#[derive(Clone, Copy, Deserialize, Serialize, Type)]
#[sqlx(type_name = "enum_ranked_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum RankedStatus {
    Loved,
    Ranked,
    Unranked,
}

pub async fn retrieve(database: &Pool<Postgres>, id: i32) -> ServerResult<Option<Beatmap>> {
    Ok(query_as::<_, Beatmap>(
        r#"SELECT accuracy, approach_rate, bpm, circle_size, difficulty_rating, id,
                last_updated, length, longest_stream, performance_100, performance_95,
                ranked_status, streams_density, streams_length, streams_spacing, title
            FROM beatmaps
            WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(database)
    .await?)
}

pub async fn retrieve_filtered_collection(
    database: &Pool<Postgres>,
    filters: &[Filter],
    title: Option<String>,
) -> ServerResult<Vec<CollectionBeatmap>> {
    let beatmaps_sql = format!(
        r#"SELECT beatmapset_id, bpm, checksum, difficulty_rating, id, streams_length FROM beatmaps {}"#,
        Filter::parse_multiple(filters, title.is_some())
    );
    let mut beatmaps = query_as::<_, CollectionBeatmap>(&beatmaps_sql);
    for filter in filters {
        beatmaps = filter.bind(beatmaps)?;
    }
    if let Some(title) = title {
        beatmaps = beatmaps.bind(title);
    }
    Ok(beatmaps.fetch_all(database).await?)
}

pub async fn retrieve_by_page(
    database: &Pool<Postgres>,
    filters: &[Filter],
    order: Order,
    page: i32,
    title: Option<String>,
) -> ServerResult<BeatmapPagination> {
    let parsed_filters = Filter::parse_multiple(filters, title.is_some());
    let beatmaps_sql = format!(
        r#"SELECT accuracy, approach_rate, beatmapset_id, bpm, circle_size,
                difficulty_rating, favorite_count, id, last_updated, length,
                longest_stream, performance_100, performance_95, play_count,
                ranked_status, streams_density, streams_length, streams_spacing, title
            FROM beatmaps {parsed_filters} {}
            LIMIT 12 OFFSET ${}"#,
        Order::parse(order),
        filters.len() + if title.is_some() { 2 } else { 1 }
    );
    let mut beatmaps = query_as::<_, BeatmapByPage>(&beatmaps_sql);
    let limit_sql = format!(r#"SELECT COUNT(id) as limit FROM beatmaps {parsed_filters}"#);
    let mut limit = query_as::<_, Limit>(&limit_sql);
    for filter in filters {
        beatmaps = filter.bind(beatmaps)?;
        limit = filter.bind(limit)?;
    }
    let mut transaction = database.begin().await?;
    if let Some(title) = title {
        (beatmaps, limit) = (beatmaps.bind(title.clone()), limit.bind(title));
    }
    let page_limit = limit.fetch_one(&mut transaction).await?.limit;
    let pagination = BeatmapPagination {
        limit: (page_limit / 12)
            + if page_limit % 12 == 0 && page_limit != 0 {
                0
            } else {
                1
            },
        beatmaps: beatmaps
            .bind((page - 1) * 12)
            .fetch_all(&mut transaction)
            .await?,
    };
    transaction.commit().await?;
    Ok(pagination)
}

pub async fn retrieve_request(
    database: &Pool<Postgres>,
    filters: &[Filter],
    use_double_time: bool,
) -> ServerResult<Option<Beatmap>> {
    let table = if use_double_time {
        "double_time_beatmaps"
    } else {
        "beatmaps"
    };
    let beatmap_sql = format!(
        r#"SELECT accuracy, approach_rate, bpm, circle_size, difficulty_rating,
                id, last_updated, length, longest_stream, performance_100,
                performance_95, ranked_status, streams_density, streams_length,
                streams_spacing, title
            FROM {table} {} ORDER BY random() LIMIT 1"#,
        Filter::parse_multiple(filters, false)
    );
    let mut beatmap = query_as::<_, Beatmap>(&beatmap_sql);
    for filter in filters {
        beatmap = filter.bind(beatmap)?;
    }
    Ok(beatmap.fetch_optional(database).await?)
}

#[cfg(test)]
mod tests {}
