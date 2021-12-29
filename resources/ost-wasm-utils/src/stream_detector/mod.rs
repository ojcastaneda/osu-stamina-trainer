mod stream_detector;
mod bpm_estimator;
mod models;

use crate::stream_detector::bpm_estimator::calculate_estimated_bpm;
use rosu_pp::{BeatmapExt, DifficultyAttributes, osu};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn process_beatmap(
	file: Box<[u8]>,
	minimum_bpm: Option<i32>,
	maximum_bpm: Option<i32>,
) -> Option<BeatmapStatistics> {
	let beatmap_file: Result<rosu_pp::Beatmap, _> = rosu_pp::Beatmap::parse(&*file);
	if beatmap_file.is_err() {
		return None;
	}
	let beatmap: rosu_pp::Beatmap = beatmap_file.unwrap();
	let difficulty_double_time: DifficultyAttributes = beatmap.stars(64, None);
	return match difficulty_double_time {
		DifficultyAttributes::Osu(osu::OsuDifficultyAttributes {
			aim_strain: _,
			speed_strain: _,
			flashlight_rating: _,
			slider_factor: _,
			ar,
			od,
			hp: _,
			n_circles: _,
			n_sliders: _,
			n_spinners: _,
			stars,
			max_combo: _,
		}) => {
			let mut stream_beatmap: models::Beatmap = stream_detector::process_beatmap(
				&beatmap,
				(
					minimum_bpm.unwrap_or(i32::MIN),
					maximum_bpm.unwrap_or(i32::MAX),
				),
			);
			calculate_estimated_bpm(&mut stream_beatmap);
			Some(BeatmapStatistics {
				suggested_bpm: stream_beatmap.suggested_bpm.bpm,
				average_stream_length: stream_beatmap.average_stream_length,
				stream_density: stream_beatmap.density,
				difficulty_double_time: stars,
				od_double_time: od,
				ar_double_time: ar,
			})
		}
		_ => None,
	}
}

#[derive(Debug)]
#[wasm_bindgen]
pub struct BeatmapStatistics {
	pub suggested_bpm: u32,
	pub average_stream_length: u32,
	pub stream_density: f64,
	pub difficulty_double_time: f64,
	pub od_double_time: f64,
	pub ar_double_time: f64,
}