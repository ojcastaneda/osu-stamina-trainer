pub mod collection_generator;
pub mod stream_detector;

#[cfg(test)]
mod tests {
	use crate::stream_detector::process_beatmap;

	#[test]
	fn stream_detector_tests() {
		let file_box = Vec::into_boxed_slice(std::fs::read("test.osu").unwrap());
		let beatmap_check = process_beatmap(file_box, None, None);
		assert_eq!(beatmap_check.is_some(), true);
		let beatmap = beatmap_check.unwrap();
		assert_eq!(beatmap.average_stream_length, 25);
		assert_eq!(beatmap.suggested_bpm, 296);
		assert_eq!((beatmap.stream_density * 10000.0) as u32, 4447);
	}
}


