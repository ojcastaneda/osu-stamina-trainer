use std::collections::HashMap;
use crate::collection_generator::{CollectionBeatmap};
use flate2::write::GzEncoder;
use flate2::Compression;
use flate2::GzBuilder;
use std::io::Write;

static OSDB_VERSION: &str = "o!dm8min";
static FOOTER: &str = "By Piotrekol";
static CREATOR: &str = "Sombrax79";

pub fn write_osdb_to_buffer(collections: HashMap<String, Vec<CollectionBeatmap>>) -> Vec<u8> {
	let mut buffer: Vec<u8> = Vec::new();
	write_string_to_buffer(&mut buffer, OSDB_VERSION);
	buffer.extend_from_slice(1.0_f64.to_le_bytes().as_slice());
	write_string_to_buffer(&mut buffer, CREATOR);
	write_collections_to_buffer(&mut buffer, collections);
	write_string_to_buffer(&mut buffer, FOOTER);
	let mut encoder: GzEncoder<Vec<u8>> = GzBuilder::new().write(Vec::new(), Compression::default());
	encoder.write_all(buffer.as_slice()).expect("");
	let mut encoded = Vec::new();
	write_string_to_buffer(&mut encoded, OSDB_VERSION);
	encoded.extend_from_slice(encoder.finish().expect("").as_slice());
	return encoded;
}

fn write_collections_to_buffer<>(buffer: &mut Vec<u8>, collections: HashMap<String, Vec<CollectionBeatmap>>) {
	buffer.extend_from_slice((collections.len() as i32).to_le_bytes().as_slice());
	for (collection, beatmaps) in collections {
		write_string_to_buffer(buffer, collection.as_str());
		buffer.extend_from_slice(i32::from(-1).to_le_bytes().as_slice());
		write_beatmaps_to_buffer(buffer, beatmaps);
	}
}

fn write_beatmaps_to_buffer(buffer: &mut Vec<u8>, beatmaps: Vec<CollectionBeatmap>) {
	buffer.extend_from_slice((beatmaps.len() as i32).to_le_bytes().as_slice());
	for beatmap in beatmaps {
		buffer.extend_from_slice(beatmap.id.unwrap().to_le_bytes().as_slice());
		buffer.extend_from_slice(beatmap.beatmapset_id.unwrap().to_le_bytes().as_slice());
		write_string_to_buffer(buffer, beatmap.checksum.as_str());
		buffer.push(0_u8);
		buffer.push(1_u8);
		buffer.extend_from_slice(beatmap.difficulty_rating.unwrap().to_le_bytes().as_slice());
	}
	buffer.extend_from_slice(0_i32.to_le_bytes().as_slice());
}

fn write_string_to_buffer(buffer: &mut Vec<u8>, string: &str) {
	buffer.push(string.len() as u8);
	buffer.extend_from_slice(string.as_bytes());
}