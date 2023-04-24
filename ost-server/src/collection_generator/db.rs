use crate::collection_generator::CollectionBeatmap;

/// The latest osu! version supported by the generator.
const OSU_VERSION: i32 = 20220406;

/// Generates a binary representation of a collection database from a vector of collections and their associated beatmaps.
pub fn generate_db(collections: Vec<(String, Vec<CollectionBeatmap>)>) -> Vec<u8> {
    let mut buffer = OSU_VERSION.to_le_bytes().to_vec();
    buffer.extend_from_slice(&(collections.len() as i32).to_le_bytes());
    for (collection, beatmaps) in collections.iter() {
        write_string(&mut buffer, collection);
        buffer.extend_from_slice(&(beatmaps.len() as i32).to_le_bytes());
        for beatmap in beatmaps {
            write_string(&mut buffer, &beatmap.checksum);
        }
    }
    buffer
}

/// Writes a string to a given buffer in a specific binary format.
fn write_string(buffer: &mut Vec<u8>, string: &str) {
    buffer.push(11_u8);
    buffer.push(string.len() as u8);
    buffer.extend_from_slice(string.as_bytes());
}
