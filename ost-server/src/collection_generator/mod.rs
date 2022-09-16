mod db;
mod osdb;

use crate::ServerResult;
use db::generate_db;
use osdb::generate_osdb;
use sqlx::FromRow;
use std::collections::HashMap;

/// Represents the information required to store a beatmap into a `.db` or a
/// `.osdb` file.
#[derive(FromRow)]
pub struct CollectionBeatmap {
    pub beatmapset_id: i32,
    pub bpm: i16,
    pub checksum: String,
    pub difficulty_rating: f32,
    pub id: i32,
    pub streams_length: i16,
}

/// Returns a `.osdb` or a `.db` buffer generated from a collection of
/// beatmaps depending on the type of set grouping wanted for the collections.
///
/// # Arguments
///
/// * `beatmaps` - A collection of beatmaps.
/// * `use_bpm_division` - An indicator of whether to use bpm division for the collections.
/// * `generate_osdb` - An indicator of whether to generate a `.osdb` or a `.db`
///   buffer.
pub async fn generate_collection_file(
    beatmaps: Vec<CollectionBeatmap>,
    use_bpm_division: bool,
    use_osdb_format: bool,
) -> ServerResult<Vec<u8>> {
    let mut collections = if use_bpm_division {
        generate_bpm_collection_file(beatmaps)
    } else {
        Vec::<(String, Vec<CollectionBeatmap>)>::from([(String::from("OST"), beatmaps)])
    };
    collections.sort_by(|(name_a, _), (name_b, _)| name_a.cmp(name_b));
    if use_osdb_format {
        Ok(generate_osdb(collections).await?)
    } else {
        Ok(generate_db(collections))
    }
}

/// Returns a set of collections of beatmaps grouped its bpm.
///
/// # Arguments
///
/// * `beatmaps` - A collection of beatmaps.
fn generate_bpm_collection_file(
    beatmaps: Vec<CollectionBeatmap>,
) -> Vec<(String, Vec<CollectionBeatmap>)> {
    let mut divisions = HashMap::<i16, Vec<CollectionBeatmap>>::new();
    for beatmap in beatmaps {
        let bpm = beatmap.bpm / 10;
        if let Some(division) = divisions.get_mut(&bpm) {
            division.push(beatmap);
        } else {
            divisions.insert(bpm, Vec::from([beatmap]));
        }
    }
    let mut collections = Vec::<(String, Vec<CollectionBeatmap>)>::with_capacity(divisions.len());
    for (bpm, beatmaps) in divisions {
        collections.push((
            format!(
                "{start}-{end}",
                start = bpm * 10,
                end = ((bpm + 1) * 10) - 1
            ),
            beatmaps,
        ));
    }
    collections
}

#[cfg(test)]
mod tests {
    use crate::collection_generator::{generate_collection_file, CollectionBeatmap};
    use tokio::fs;

    fn setup_test() -> Vec<CollectionBeatmap> {
        vec![
            CollectionBeatmap {
                id: 847314,
                beatmapset_id: 128931,
                bpm: 175,
                streams_length: 10,
                difficulty_rating: 5.14,
                checksum: String::from("e4ad76f1a6b4e3bcfb1652d49159eff9"),
            },
            CollectionBeatmap {
                id: 476149,
                beatmapset_id: 153776,
                bpm: 190,
                streams_length: 5,
                difficulty_rating: 4.88,
                checksum: String::from("d6c8ba1406ad3de9381f51abf74be544"),
            },
            CollectionBeatmap {
                id: 1949106,
                beatmapset_id: 933630,
                bpm: 210,
                streams_length: 30,
                difficulty_rating: 7.49,
                checksum: String::from("1ff6975c142ac59e4731cb09f5d46bcc"),
            },
        ]
    }

    #[tokio::test]
    async fn test_create_db_collection_by_bpm() {
        let collection = generate_collection_file(setup_test(), true, false)
            .await
            .unwrap();
        assert_eq!(&collection, &fs::read("./test_files/bpm.db").await.unwrap());
    }

    #[tokio::test]
    async fn test_create_db_collection() {
        let collection = generate_collection_file(setup_test(), false, false)
            .await
            .unwrap();
        assert_eq!(
            &collection,
            &fs::read("./test_files/collection.db").await.unwrap()
        );
    }

    #[tokio::test]
    async fn test_create_osdb_collection_by_bpm() {
        let collection = generate_collection_file(setup_test(), true, true)
            .await
            .unwrap();
        assert_eq!(
            &collection,
            &fs::read("./test_files/bpm.osdb").await.unwrap()
        );
    }

    #[tokio::test]
    async fn test_create_osdb_collection() {
        let collection = generate_collection_file(setup_test(), false, true)
            .await
            .unwrap();
        assert_eq!(
            &collection,
            &fs::read("./test_files/collection.osdb").await.unwrap()
        );
    }
}
