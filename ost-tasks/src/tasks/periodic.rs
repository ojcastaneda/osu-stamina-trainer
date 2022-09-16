use super::{create_beatmap, log_date_progress, Services, Tasks, THREADS};
use crate::{
    models::{beatmap, submission, unchecked_submission},
    osu_files, TaskResult,
};
use ost_utils::{
    osu_api::{self, models::Beatmap, IDS_LIMIT},
    storage::{self, models::Cursor},
};
use sqlx::{
    types::chrono::{DateTime, Utc},
    Pool, Postgres,
};
use std::collections::{HashMap, HashSet};
use tokio::try_join;

pub async fn add_beatmap(
    beatmap: Beatmap,
    database: Pool<Postgres>,
    storage: storage::Client,
    mut osu_files: osu_files::Client,
) -> TaskResult<()> {
    let file = osu_files.download(beatmap.id).await?.unwrap();
    storage
        .upload(&file, format!("beatmaps/{}.osu", beatmap.id))
        .await?;
    if beatmap.is_ranked() {
        submission::delete(&database, beatmap.id).await?;
        create_beatmap(&beatmap, &database, &file).await?;
    }
    Ok(())
}

pub async fn add_beatmaps(limit_date: i64, mut services: Services) -> TaskResult<()> {
    tracing::info!("Adding ranked beatmaps: start");
    let mut cursor = Cursor::retrieve(&services.storage).await?;
    let start = cursor.approved_date;
    loop {
        let (beatmaps, approved_date, id) = services
            .osu_api
            .retrieve_leaderboard_beatmaps(cursor.approved_date, cursor.id, limit_date)
            .await?;
        let mut tasks = Tasks::new(beatmaps.len(), beatmaps.len(), false, None);
        for beatmap in beatmaps {
            tasks
                .spawn(add_beatmap(
                    beatmap,
                    services.database.clone(),
                    services.storage.clone(),
                    services.osu_files.clone(),
                ))
                .await?;
        }
        log_date_progress(
            approved_date,
            limit_date,
            false,
            start,
            "ranked beatmaps processed",
        );
        cursor = Cursor::new(approved_date, id);
        cursor.update(&services.storage).await?;
        if approved_date >= limit_date {
            break;
        }
    }
    tracing::info!("Adding ranked beatmaps: end");
    Ok(())
}

async fn check_beatmaps(mut services: Services, submissions: Vec<i32>) -> TaskResult<()> {
    let mut tasks = Tasks::new(
        IDS_LIMIT,
        submissions.len(),
        false,
        Some("unchecked beatmaps processed"),
    );
    let mut beatmaps = HashSet::with_capacity(IDS_LIMIT);
    for chunk in submissions.chunks(IDS_LIMIT) {
        chunk.iter().for_each(|beatmap| {
            beatmaps.insert(*beatmap);
        });
        for beatmap in services.osu_api.retrieve_beatmaps(chunk).await? {
            beatmaps.remove(&beatmap.id);
            let database = services.database.clone();
            if beatmap.is_ranked() {
                tasks
                    .spawn(async move { unchecked_submission::delete(&database, beatmap.id).await })
                    .await?;
                continue;
            }
            let title = format!(
                "{} [{}]",
                &beatmap.beatmapset.unwrap().title,
                &beatmap.version
            );
            tasks
                .spawn(async move {
                    submission::create_or_update(
                        &database,
                        beatmap.beatmapset_id,
                        beatmap.id,
                        &title,
                    )
                    .await?;
                    unchecked_submission::delete(&database, beatmap.id).await
                })
                .await?;
        }
        for id in beatmaps.drain() {
            let database = services.database.clone();
            tasks
                .spawn(async move { unchecked_submission::delete(&database, id).await })
                .await?;
        }
    }
    Ok(())
}

async fn check_beatmapset(
    database: Pool<Postgres>,
    id: i32,
    mut osu_api: osu_api::Client,
) -> TaskResult<()> {
    if let Some(beatmapset) = osu_api.retrieve_beatmapset(id.abs()).await? {
        let beatmaps = beatmapset.beatmaps.unwrap();
        let mut tasks = Tasks::new(beatmaps.len(), beatmaps.len(), false, None);
        for beatmap in beatmaps {
            if beatmap.is_ranked() {
                tasks.spawn(async { Ok(()) }).await?;
                continue;
            }
            let database_clone = database.clone();
            let title = format!("{} [{}]", &beatmapset.title, &beatmap.version);
            tasks
                .spawn(async move {
                    submission::create_or_update(
                        &database_clone,
                        beatmap.beatmapset_id,
                        beatmap.id,
                        &title,
                    )
                    .await
                })
                .await?;
        }
    }
    unchecked_submission::delete(&database, id).await?;
    Ok(())
}

async fn check_beatmapsets(services: Services, submissions: Vec<i32>) -> TaskResult<()> {
    let mut tasks = Tasks::new(
        THREADS,
        submissions.len(),
        false,
        Some("unchecked beatmapsets processed"),
    );
    for chunk in submissions.chunks(IDS_LIMIT) {
        for beatmapset in chunk {
            tasks
                .spawn(check_beatmapset(
                    services.database.clone(),
                    *beatmapset,
                    services.osu_api.clone(),
                ))
                .await?;
        }
    }
    Ok(())
}

pub async fn check_submissions(services: Services) -> TaskResult<()> {
    tracing::info!("Checking submissions: start");
    let submissions = unchecked_submission::retrieve_all(&services.database).await?;
    let mut beatmaps = Vec::new();
    let mut beatmapsets = Vec::new();
    submissions.iter().for_each(|submission| {
        if submission.id.is_negative() {
            beatmapsets.push(submission.id);
        } else {
            beatmaps.push(submission.id.abs());
        }
    });
    try_join!(
        check_beatmaps(services.clone(), beatmaps),
        check_beatmapsets(services, beatmapsets)
    )?;
    tracing::info!("Checking submissions: end");
    Ok(())
}

async fn process_submission(mut services: Services, beatmap: Beatmap) -> TaskResult<()> {
    let file = services.osu_files.download(beatmap.id).await?.unwrap();
    if !beatmap.is_ranked() && create_beatmap(&beatmap, &services.database, &file).await? {
        services
            .storage
            .upload(&file, format!("beatmaps/{}.osu", beatmap.id))
            .await?;
        submission::approve(&services.database, beatmap.id).await?;
        return Ok(());
    }
    submission::delete(&services.database, beatmap.id).await?;
    Ok(())
}

pub async fn process_submissions(mut services: Services) -> TaskResult<()> {
    tracing::info!("Processing submissions: start");
    let submissions = submission::retrieve_all_processing(&services.database).await?;
    let mut tasks = Tasks::new(
        THREADS,
        submissions.len(),
        false,
        Some("submissions processed"),
    );
    let mut beatmaps = HashSet::with_capacity(IDS_LIMIT);
    for chunk in submissions.chunks(IDS_LIMIT) {
        let ids = chunk.iter().map(|beatmap| {
            beatmaps.insert(beatmap.id);
            beatmap.id
        });
        for submission in services
            .osu_api
            .retrieve_beatmaps(&ids.collect::<Vec<i32>>())
            .await?
        {
            beatmaps.remove(&submission.id);
            tasks
                .spawn(process_submission(services.clone(), submission))
                .await?;
        }
        for id in beatmaps.drain() {
            let database = services.database.clone();
            tasks
                .spawn(async move { submission::delete(&database, id).await })
                .await?;
        }
    }
    tracing::info!("Processing submissions: end");
    Ok(())
}

async fn synchronize_beatmap(
    beatmap: Beatmap,
    database: Pool<Postgres>,
    last_updated_submission: Option<DateTime<Utc>>,
    storage: storage::Client,
) -> TaskResult<()> {
    if let Some(last_updated) = last_updated_submission {
        if last_updated < beatmap.last_updated {
            let title = format!(
                "{} [{}]",
                &beatmap.beatmapset.unwrap().title,
                &beatmap.version
            );
            submission::resubmit(&database, beatmap.id, &title).await?;
            storage
                .delete(format!("beatmaps/{}.osu", beatmap.id))
                .await?;
            return Ok(());
        }
    }
    let beatmapset = beatmap.beatmapset.unwrap();
    beatmap::synchronize_attributes(
        &database,
        beatmapset.favourite_count,
        beatmap.id,
        beatmapset.play_count,
    )
    .await?;
    Ok(())
}

pub async fn synchronize_with_osu_api(mut services: Services) -> TaskResult<()> {
    tracing::info!("Synchronizing with osu! API: start");
    let beatmaps = beatmap::retrieve_all(&services.database).await?;
    let mut submissions = HashMap::with_capacity(IDS_LIMIT);
    let mut tasks = Tasks::new(
        IDS_LIMIT,
        beatmaps.len(),
        false,
        Some("collection beatmaps processed"),
    );
    for chunk in beatmaps.chunks(IDS_LIMIT) {
        let ids = chunk.iter().map(|beatmap| {
            if !matches!(beatmap.ranked_status, beatmap::RankedStatus::Ranked) {
                submissions.insert(beatmap.id, beatmap.last_updated);
            }
            beatmap.id
        });
        for beatmap in services
            .osu_api
            .retrieve_beatmaps(&ids.collect::<Vec<i32>>())
            .await?
        {
            let last_updated = submissions.remove(&beatmap.id);
            tasks
                .spawn(synchronize_beatmap(
                    beatmap,
                    services.database.clone(),
                    last_updated,
                    services.storage.clone(),
                ))
                .await?;
        }
        for (id, _) in submissions.drain() {
            let database = services.database.clone();
            tasks
                .spawn(async move { beatmap::delete(&database, id, true).await })
                .await?;
        }
    }
    tracing::info!("Synchronizing with osu! API: end");
    Ok(())
}
