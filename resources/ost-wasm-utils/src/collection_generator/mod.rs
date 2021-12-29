mod osdb;
mod db;

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use crate::collection_generator::db::write_db_to_buffer;
use crate::collection_generator::osdb::write_osdb_to_buffer;

static BURSTS: &str = "bursts";
static STREAMS: &str = "streams";
static DEATHSTREAMS: &str = "deathstreams";

#[wasm_bindgen]
pub fn generate_collection(js_beatmaps: &JsValue, use_bpm_division: bool, generate_osdb: bool) -> Vec<u8> {
	let beatmaps: Vec<CollectionBeatmap> = js_beatmaps.into_serde().unwrap();
	return if use_bpm_division { generate_bpm_collection(beatmaps, generate_osdb) } else { generate_stream_length_collection(beatmaps, generate_osdb) };
}

fn generate_stream_length_collection(beatmaps: Vec<CollectionBeatmap>, generate_osdb: bool) -> Vec<u8> {
	let mut bursts: Vec<CollectionBeatmap> = Vec::new();
	let mut streams: Vec<CollectionBeatmap> = Vec::new();
	let mut deathstreams: Vec<CollectionBeatmap> = Vec::new();
	for beatmap in beatmaps {
		let stream_length = beatmap.stream_length.unwrap();
		if stream_length < 9 {
			bursts.push(beatmap)
		} else if stream_length < 25 {
			streams.push(beatmap)
		} else {
			deathstreams.push(beatmap)
		}
	}
	let mut collections: HashMap<String, Vec<CollectionBeatmap>> = HashMap::new();
	if bursts.len() > 0 { collections.insert(String::from(BURSTS), bursts); }
	if streams.len() > 0 { collections.insert(String::from(STREAMS), streams); }
	if deathstreams.len() > 0 { collections.insert(String::from(DEATHSTREAMS), deathstreams); }
	return if generate_osdb { write_osdb_to_buffer(collections) } else { write_db_to_buffer(collections) };
}

fn generate_bpm_collection(beatmaps: Vec<CollectionBeatmap>, generate_osdb: bool) -> Vec<u8> {
	let mut divisions: HashMap<u32, Vec<CollectionBeatmap>> = HashMap::new();
	for beatmap in beatmaps {
		let bpm = beatmap.bpm.unwrap() / 10;
		let division = divisions.get_mut(&bpm);
		if division.is_some() { division.unwrap().push(beatmap); } else { divisions.insert(bpm, Vec::from([beatmap])); }
	}
	let mut collections: HashMap<String, Vec<CollectionBeatmap>> = HashMap::new();
	for (bpm, beatmaps) in divisions {
		collections.insert(format!("{}-{}", bpm * 10, ((bpm + 1) * 10) - 1), beatmaps);
	}
	if generate_osdb { return write_osdb_to_buffer(collections); } else { return write_db_to_buffer(collections); }
}

#[derive(Serialize, Deserialize)]
pub struct CollectionBeatmap {
	pub id: Option<u32>,
	pub beatmapset_id: Option<u32>,
	pub checksum: String,
	pub difficulty_rating: Option<f64>,
	pub bpm: Option<u32>,
	pub stream_length: Option<u32>,
}