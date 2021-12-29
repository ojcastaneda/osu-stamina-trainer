use std::collections::HashMap;
use crate::collection_generator::{CollectionBeatmap};

static OSU_VERSION: u32 = 20211225;

pub fn write_db_to_buffer(collections: HashMap<String, Vec<CollectionBeatmap>>) -> Vec<u8> {
	let mut buffer: Vec<u8> = Vec::from(OSU_VERSION.to_le_bytes().as_slice());
	buffer.extend_from_slice((collections.len() as i32).to_le_bytes().as_slice());
	for (collection, beatmaps) in collections {
		write_string_to_buffer(&mut buffer, collection.as_str());
		buffer.extend_from_slice((beatmaps.len() as i32).to_le_bytes().as_slice());
		for beatmap in beatmaps { write_string_to_buffer(&mut buffer, beatmap.checksum.as_str()); }
	}
	return buffer;
}

fn write_string_to_buffer(buffer: &mut Vec<u8>, string: &str) {
	buffer.push(11_u8);
	buffer.push(string.len() as u8);
	buffer.extend_from_slice(string.as_bytes());
}