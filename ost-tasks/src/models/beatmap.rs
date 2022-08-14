use ost_utils::{beatmaps_processor, osu_api};
use sqlx::{
    query, query_as,
    types::chrono::{DateTime, Utc},
    FromRow, Pool, Postgres, Type,
};

use crate::TaskResult;

#[derive(FromRow)]
pub struct Beatmap {
    pub accuracy: f32,
    pub approach_rate: f32,
    pub beatmapset_id: i32,
    pub bpm: i16,
    pub checksum: String,
    pub circle_size: f32,
    pub difficulty_rating: f32,
    pub favorite_count: i32,
    pub id: i32,
    pub last_requested: Option<DateTime<Utc>>,
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

#[derive(FromRow)]
pub struct BeatmapLastUpdated {
    pub id: i32,
    pub last_updated: DateTime<Utc>,
    pub ranked_status: RankedStatus,
}

#[derive(FromRow)]
pub struct DoubleTimeBeatmap {
    pub accuracy: f32,
    pub approach_rate: f32,
    pub bpm: i16,
    pub difficulty_rating: f32,
    pub length: i16,
    pub performance_100: i16,
    pub performance_95: i16,
}

#[derive(Clone, Copy, Type)]
#[sqlx(type_name = "enum_ranked_status", rename_all = "snake_case")]
pub enum RankedStatus {
    Loved,
    Ranked,
    Unranked,
}

pub async fn create_or_update(
    database: &Pool<Postgres>,
    beatmap: Beatmap,
    double_time_beatmap: DoubleTimeBeatmap,
) -> TaskResult<()> {
    let mut transaction = database.begin().await?;
    query(
        r#"INSERT INTO beatmaps
            (accuracy, approach_rate, beatmapset_id, bpm, checksum, circle_size,
                difficulty_rating, favorite_count, id, last_requested, last_updated, length,
                longest_stream, performance_100, performance_95, play_count,
                ranked_status, streams_density, streams_length, streams_spacing, title)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, $20, $21)
            ON CONFLICT (id) DO
            UPDATE SET bpm = $4, difficulty_rating = $7, favorite_count = $8,
                performance_100 = $14, performance_95 = $15, play_count = $16,
                streams_density = $18, streams_length = $19, streams_spacing = $20"#,
    )
    .bind(beatmap.accuracy)
    .bind(beatmap.approach_rate)
    .bind(beatmap.beatmapset_id)
    .bind(beatmap.bpm)
    .bind(beatmap.checksum)
    .bind(beatmap.circle_size)
    .bind(beatmap.difficulty_rating)
    .bind(beatmap.favorite_count)
    .bind(beatmap.id)
    .bind(beatmap.last_requested)
    .bind(beatmap.last_updated)
    .bind(beatmap.length)
    .bind(beatmap.longest_stream)
    .bind(beatmap.performance_100)
    .bind(beatmap.performance_95)
    .bind(beatmap.play_count)
    .bind(beatmap.ranked_status)
    .bind(beatmap.streams_density)
    .bind(beatmap.streams_length)
    .bind(beatmap.streams_spacing)
    .bind(&beatmap.title)
    .execute(&mut transaction)
    .await?;
    query(
        r#"INSERT INTO double_time_beatmaps
            (accuracy, approach_rate, bpm, circle_size, difficulty_rating, id,
                last_updated, length, longest_stream, performance_100,
                performance_95, ranked_status, streams_density,
                streams_length, streams_spacing, title)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16)
            ON CONFLICT (id) DO
            UPDATE SET bpm = $3, difficulty_rating = $5, performance_100 = $10,
                performance_95 = $11, streams_density = $13,
                streams_length = $14, streams_spacing = $15"#,
    )
    .bind(double_time_beatmap.accuracy)
    .bind(double_time_beatmap.approach_rate)
    .bind(double_time_beatmap.bpm)
    .bind(beatmap.circle_size)
    .bind(double_time_beatmap.difficulty_rating)
    .bind(beatmap.id)
    .bind(beatmap.last_updated)
    .bind(double_time_beatmap.length)
    .bind(beatmap.longest_stream)
    .bind(double_time_beatmap.performance_100)
    .bind(double_time_beatmap.performance_95)
    .bind(beatmap.ranked_status)
    .bind(beatmap.streams_density)
    .bind(beatmap.streams_length)
    .bind(beatmap.streams_spacing)
    .bind(beatmap.title)
    .execute(&mut transaction)
    .await?;
    transaction.commit().await?;
    Ok(())
}

pub async fn delete(database: &Pool<Postgres>, id: i32, is_submission: bool) -> TaskResult<()> {
    let mut transaction = database.begin().await?;
    if is_submission {
        query(r#"DELETE FROM submissions WHERE id = $1"#)
            .bind(id)
            .execute(&mut transaction)
            .await?;
    }
    query(r#"DELETE FROM beatmaps WHERE id = $1"#)
        .bind(id)
        .execute(&mut transaction)
        .await?;
    transaction.commit().await?;
    Ok(())
}

pub fn parse_beatmap(
    beatmap: &osu_api::models::Beatmap,
    beatmap_statistics: beatmaps_processor::Beatmap,
) -> (Beatmap, DoubleTimeBeatmap) {
    let beatmapset = beatmap.beatmapset.as_ref().unwrap();
    (
        Beatmap {
            id: beatmap.id,
            accuracy: beatmap_statistics.accuracy.no_modification,
            approach_rate: beatmap_statistics.approach_rate.no_modification,
            beatmapset_id: beatmap.beatmapset_id,
            bpm: beatmap_statistics.bpm.no_modification,
            checksum: beatmap.checksum.clone(),
            circle_size: beatmap_statistics.circle_size,
            difficulty_rating: beatmap_statistics.difficulty_rating.no_modification,
            favorite_count: beatmapset.favourite_count,
            last_requested: None,
            last_updated: if let Some(ranked_date) = beatmapset.ranked_date {
                ranked_date
            } else {
                beatmap.last_updated
            },
            length: beatmap.total_length,
            longest_stream: beatmap_statistics.longest_stream,
            performance_100: beatmap_statistics.performance_100.no_modification,
            performance_95: beatmap_statistics.performance_95.no_modification,
            play_count: beatmapset.play_count,
            ranked_status: if beatmap.is_ranked() {
                RankedStatus::Ranked
            } else if beatmap.is_loved() {
                RankedStatus::Loved
            } else {
                RankedStatus::Unranked
            },
            streams_density: beatmap_statistics.streams_density,
            streams_length: beatmap_statistics.streams_length,
            streams_spacing: beatmap_statistics.streams_spacing,
            title: format!("{} [{}]", &beatmapset.title, &beatmap.version),
        },
        DoubleTimeBeatmap {
            accuracy: beatmap_statistics.accuracy.double_time,
            approach_rate: beatmap_statistics.approach_rate.double_time,
            bpm: beatmap_statistics.bpm.double_time,
            difficulty_rating: beatmap_statistics.difficulty_rating.double_time,
            length: beatmap.total_length * 2 / 3,
            performance_100: beatmap_statistics.performance_100.double_time,
            performance_95: beatmap_statistics.performance_95.double_time,
        },
    )
}

pub async fn retrieve_all(database: &Pool<Postgres>) -> TaskResult<Vec<BeatmapLastUpdated>> {
    Ok(
        query_as::<_, BeatmapLastUpdated>(
            r#"SELECT id, last_updated, ranked_status FROM beatmaps"#,
        )
        .fetch_all(database)
        .await?,
    )
}

pub async fn synchronize_attributes(
    database: &Pool<Postgres>,
    favorite_count: i32,
    id: i32,
    play_count: i32,
) -> TaskResult<()> {
    query(r#"UPDATE beatmaps SET favorite_count = $1, play_count = $2 WHERE id = $3"#)
        .bind(favorite_count)
        .bind(play_count)
        .bind(id)
        .execute(database)
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {}
