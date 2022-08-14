use super::{create_beatmap, Services, Tasks, THREADS};
use crate::{
    models::beatmap::{self, RankedStatus},
    osu_files,
    tasks::log_date_progress,
    TaskResult,
};
use ost_utils::{
    osu_api::{models::Beatmap, IDS_LIMIT},
    storage::{self, models::Cursor},
};
use rosu_pp::GameMode;
use sqlx::{Pool, Postgres};
use std::{
    collections::HashSet,
    ffi::OsStr,
    fs::{read_dir, DirEntry},
    path::PathBuf,
};
use tokio::{
    fs::{read, remove_file, write},
    try_join,
};

async fn setup_file(storage: storage::Client, path: PathBuf, upload_file: bool) -> TaskResult<()> {
    let file = read(&path).await?;
    if let Ok(beatmap) = rosu_pp::Beatmap::parse(file.as_ref()).await {
        if matches!(beatmap.mode, GameMode::Osu) && upload_file {
            storage
                .upload(
                    &file,
                    format!("beatmaps/{}", path.file_name().unwrap().to_str().unwrap()),
                )
                .await?;
        }
        return Ok(());
    }
    remove_file(&path).await?;
    Ok(())
}

pub async fn setup_files(upload_files: bool) -> TaskResult<()> {
    let storage = storage::Client::from_environment().await?;
    let paths = read_dir("./beatmaps")?
        .flatten()
        .filter(|file| file.path().as_path().extension() == Some(OsStr::new("osu")))
        .collect::<Vec<DirEntry>>();
    let mut tasks = Tasks::new(THREADS, paths.len(), Some("files processed"));
    for path in paths {
        tasks
            .spawn(setup_file(storage.clone(), path.path(), upload_files))
            .await?;
    }
    Ok(())
}

async fn update_beatmap(
    beatmap: Beatmap,
    database: Pool<Postgres>,
    storage: storage::Client,
    mut osu_files: osu_files::Client,
) -> TaskResult<i32> {
    let file = if let Ok(file) = read(format!("./beatmaps/{}.osu", beatmap.id)).await {
        file
    } else if let Ok(file) = storage
        .retrieve(format!("beatmaps/{}.osu", beatmap.id))
        .await
    {
        write(format!("./beatmaps/{}.osu", beatmap.id), &file).await?;
        file
    } else if let Some(file) = osu_files.download(beatmap.id).await? {
        storage
            .upload(&file, format!("beatmaps/{}.osu", beatmap.id))
            .await?;
        write(format!("./beatmaps/{}.osu", beatmap.id), &file).await?;
        file
    } else {
        return Ok(0);
    };
    if beatmap.is_ranked() && create_beatmap(&beatmap, &database, &file).await? {
        return Ok(beatmap.id);
    }
    Ok(0)
}

async fn update_beatmaps(
    limit_date: i64,
    mut local_beatmaps: HashSet<i32>,
    mut services: Services,
) -> TaskResult<()> {
    let mut cursor = Cursor::new(0, 0);
    loop {
        let (beatmaps, approved_date, id) = services
            .osu_api
            .retrieve_leaderboard_beatmaps(cursor.approved_date, cursor.id, limit_date)
            .await?;
        let mut tasks = Tasks::new(beatmaps.len(), beatmaps.len(), None);
        for beatmap in beatmaps {
            if let Some(ids) = tasks
                .spawn(update_beatmap(
                    beatmap,
                    services.database.clone(),
                    services.storage.clone(),
                    services.osu_files.clone(),
                ))
                .await?
            {
                ids.iter().for_each(|id| {
                    local_beatmaps.remove(id);
                });
            }
        }
        log_date_progress(
            approved_date,
            limit_date,
            1_191_710_791_000,
            "ranked beatmaps processed",
        );
        cursor = Cursor::new(approved_date, id);
        if approved_date >= limit_date {
            break;
        }
    }
    let mut tasks = Tasks::new(
        THREADS,
        local_beatmaps.len(),
        Some("not suitable beatmaps deleted"),
    );
    for id in local_beatmaps {
        let database = services.database.clone();
        tasks
            .spawn(async move { beatmap::delete(&database, id, false).await })
            .await?;
    }
    cursor.update(&services.storage).await?;
    Ok(())
}

pub async fn update_collection(limit_date: i64, services: Services) -> TaskResult<()> {
    let mut ranked_beatmaps = HashSet::new();
    let mut submissions = Vec::new();
    for beatmap in beatmap::retrieve_all(&services.database).await? {
        if let RankedStatus::Ranked = beatmap.ranked_status {
            ranked_beatmaps.insert(beatmap.id);
        } else {
            submissions.push(beatmap.id);
        }
    }
    try_join!(
        update_beatmaps(limit_date, ranked_beatmaps, services.clone()),
        updated_submissions(services, submissions)
    )?;
    Ok(())
}

async fn update_submission(
    beatmap: Beatmap,
    database: Pool<Postgres>,
    storage: storage::Client,
) -> TaskResult<()> {
    let file = storage
        .retrieve(format!("beatmaps/{}.osu", beatmap.id))
        .await?;
    if !create_beatmap(&beatmap, &database, &file).await? {
        beatmap::delete(&database, beatmap.id, true).await?;
    }
    Ok(())
}

async fn updated_submissions(mut services: Services, submissions: Vec<i32>) -> TaskResult<()> {
    let mut tasks = Tasks::new(IDS_LIMIT, submissions.len(), Some("submissions processed"));
    let mut beatmaps = HashSet::with_capacity(IDS_LIMIT);
    for chunk in submissions.chunks(IDS_LIMIT) {
        chunk.iter().for_each(|beatmap| {
            beatmaps.insert(*beatmap);
        });
        for submission in services.osu_api.retrieve_beatmaps(chunk).await? {
            beatmaps.remove(&submission.id);
            tasks
                .spawn(update_submission(
                    submission,
                    services.database.clone(),
                    services.storage.clone(),
                ))
                .await?;
        }
        for id in beatmaps.drain() {
            let database = services.database.clone();
            tasks
                .spawn(async move { beatmap::delete(&database, id, true).await })
                .await?;
        }
    }
    Ok(())
}
