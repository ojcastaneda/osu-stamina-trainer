use crate::{collection_generator::CollectionBeatmap, ServerResult};
use async_compression::tokio::write::GzipEncoder;
use tokio::io::AsyncWriteExt;

/// The latest `.osdb` version supported by the generator.
const OSDB_VERSION: &str = "o!dm8min";
/// The required footer for the `.osdb` files.
const FOOTER: &str = "By Piotrekol";
/// The creator of the collections sets.
const CREATOR: &str = "Sombrax79";

/// Returns a `.osdb` buffer generated from a set of collections of
/// beatmaps.
///
/// # Arguments
///
/// * `collections` - A set of collections of beatmaps grouped by the
///   collection's name.
pub async fn generate_osdb(
    collections: Vec<(String, Vec<CollectionBeatmap>)>,
) -> ServerResult<Vec<u8>> {
    let mut buffer = Vec::<u8>::new();
    write_string(&mut buffer, OSDB_VERSION);
    buffer.extend_from_slice(1.0_f64.to_le_bytes().as_slice());
    write_string(&mut buffer, CREATOR);
    write_collections(&mut buffer, collections);
    write_string(&mut buffer, FOOTER);
    let mut encoded = Vec::<u8>::new();
    write_string(&mut encoded, OSDB_VERSION);
    let mut encoder = GzipEncoder::new(Vec::<u8>::new());
    encoder.write_all(buffer.as_slice()).await?;
    encoder.shutdown().await?;
    encoded.extend_from_slice(encoder.into_inner().as_slice());
    Ok(encoded)
}

/// Writes a collection of beatmaps into the `.osdb` buffer.
///
/// # Arguments
///
/// * `buffer` - A previously initialized `.osdb` buffer.
/// * `beatmaps` - A collection of beatmaps.
fn write_beatmaps(beatmaps: Vec<CollectionBeatmap>, buffer: &mut Vec<u8>) {
    buffer.extend_from_slice((beatmaps.len() as i32).to_le_bytes().as_slice());
    for beatmap in beatmaps {
        buffer.extend_from_slice((beatmap.id).to_le_bytes().as_slice());
        buffer.extend_from_slice((beatmap.beatmapset_id).to_le_bytes().as_slice());
        write_string(buffer, &beatmap.checksum);
        buffer.push(0_u8);
        buffer.push(1_u8);
        buffer.extend_from_slice((beatmap.difficulty_rating as f64).to_le_bytes().as_slice());
    }
    buffer.extend_from_slice(0_i32.to_le_bytes().as_slice());
}

/// Writes a set of collections of beatmaps into the `.osdb` buffer.
///
/// # Arguments
///
/// * `buffer` - A previously initialized `.osdb` buffer.
/// * `collections` - A set of collections of beatmaps grouped by the
///   collection's name.
fn write_collections(buffer: &mut Vec<u8>, collections: Vec<(String, Vec<CollectionBeatmap>)>) {
    buffer.extend_from_slice((collections.len() as i32).to_le_bytes().as_slice());
    for (collection, beatmaps) in collections {
        write_string(buffer, &collection);
        buffer.extend_from_slice((-1_i32).to_le_bytes().as_slice());
        write_beatmaps(beatmaps, buffer);
    }
}

/// Writes a string into the `.osdb` buffer.
///
/// # Arguments
///
/// * `buffer` - A previously initialized `.osdb` buffer.
/// * `string` - A string.
fn write_string(buffer: &mut Vec<u8>, string: &str) {
    buffer.push(string.len() as u8);
    buffer.extend_from_slice(string.as_bytes());
}
