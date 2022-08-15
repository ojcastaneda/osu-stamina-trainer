mod error;
mod models;
mod streams_processor;

use rosu_pp::{BeatmapExt, GameMode, OsuPP};

pub type Error = error::Error;

#[derive(Debug)]
pub struct Beatmap {
    pub accuracy: ModDecimal,
    pub approach_rate: ModDecimal,
    pub bpm: ModInteger,
    pub circle_size: f32,
    pub difficulty_rating: ModDecimal,
    pub longest_stream: i16,
    pub performance_100: ModInteger,
    pub performance_95: ModInteger,
    pub streams_density: f32,
    pub streams_spacing: f32,
    pub streams_length: i16,
    pub total_length: i16,
}

#[derive(Debug)]
pub struct ModDecimal {
    pub double_time: f32,
    pub no_modification: f32,
}

impl ModDecimal {
    fn new(decimals: i32, double_time: f64, no_modification: f64) -> Self {
        Self {
            double_time: round_decimal(decimals, double_time),
            no_modification: round_decimal(decimals, no_modification),
        }
    }
}

#[derive(Debug)]
pub struct ModInteger {
    pub double_time: i16,
    pub no_modification: i16,
}

impl ModInteger {
    fn new(double_time: f64, no_modification: f64) -> Self {
        Self {
            double_time: double_time.round() as i16,
            no_modification: no_modification.round() as i16,
        }
    }
}

pub async fn process_beatmap(file: &[u8]) -> Result<Beatmap, Error> {
    let beatmap_file = rosu_pp::Beatmap::parse(file).await?;
    if beatmap_file.mode != GameMode::Osu
        || beatmap_file.hit_objects.len() < 2
        || beatmap_file.timing_points.is_empty()
    {
        return Err(Error::ParseBeatmap(rosu_pp::ParseError::InvalidMode));
    }
    let (double_time, no_modification) = (
        OsuPP::new(&beatmap_file)
            .mods(64)
            .accuracy(95.0)
            .calculate(),
        OsuPP::new(&beatmap_file).accuracy(95.0).calculate(),
    );
    let beatmap = streams_processor::process_beatmap(&beatmap_file);
    Ok(Beatmap {
        accuracy: ModDecimal::new(1, double_time.difficulty.od, no_modification.difficulty.od),
        approach_rate: ModDecimal::new(1, double_time.difficulty.ar, no_modification.difficulty.ar),
        bpm: ModInteger::new(
            beatmap.predominant_bpm.bpm as f64 * 1.5,
            beatmap.predominant_bpm.bpm as f64,
        ),
        circle_size: beatmap.circle_size as f32,
        difficulty_rating: ModDecimal::new(2, double_time.stars(), no_modification.stars()),
        longest_stream: beatmap.longest_stream,
        performance_100: ModInteger::new(beatmap_file.max_pp(64).pp(), beatmap_file.max_pp(0).pp()),
        performance_95: ModInteger::new(double_time.pp, no_modification.pp),
        streams_density: round_decimal(2, beatmap.streams_density),
        streams_length: beatmap.streams_length,
        streams_spacing: round_decimal(2, beatmap.streams_spacing),
        total_length: beatmap.total_length,
    })
}

fn round_decimal(decimals: i32, number: f64) -> f32 {
    let decimal_parser = 10_f64.powi(decimals);
    ((decimal_parser * number).round() / decimal_parser) as f32
}

#[cfg(test)]
mod tests {
    use super::{Beatmap, ModDecimal, ModInteger};
    use crate::beatmaps_processor::process_beatmap;
    use std::error::Error;
    use tokio::fs;

    fn compare_beatmaps(beatmap: Beatmap, test_beatmap: Beatmap) {
        assert_eq!(
            beatmap.accuracy.double_time,
            test_beatmap.accuracy.double_time
        );
        assert_eq!(
            beatmap.accuracy.no_modification,
            test_beatmap.accuracy.no_modification
        );
        assert_eq!(
            beatmap.approach_rate.double_time,
            test_beatmap.approach_rate.double_time
        );
        assert_eq!(
            beatmap.approach_rate.no_modification,
            test_beatmap.approach_rate.no_modification
        );
        assert_eq!(beatmap.bpm.double_time, test_beatmap.bpm.double_time);
        assert_eq!(
            beatmap.bpm.no_modification,
            test_beatmap.bpm.no_modification
        );
        assert_eq!(beatmap.circle_size, test_beatmap.circle_size);
        assert!(beatmap.difficulty_rating.double_time > beatmap.difficulty_rating.no_modification);
        assert_eq!(beatmap.longest_stream, test_beatmap.longest_stream);
        assert!(beatmap.performance_100.double_time > beatmap.performance_100.no_modification);
        assert!(beatmap.performance_100.double_time > beatmap.performance_95.double_time);
        assert!(beatmap.performance_100.no_modification > beatmap.performance_95.no_modification);
        assert!(beatmap.performance_95.double_time > beatmap.performance_95.no_modification);
        assert_eq!(beatmap.streams_density, test_beatmap.streams_density);
        assert_eq!(beatmap.streams_length, test_beatmap.streams_length);
        assert_eq!(beatmap.streams_spacing, test_beatmap.streams_spacing);
        assert_eq!(beatmap.total_length, test_beatmap.total_length);
    }

    #[tokio::test]
    async fn test_process_beatmap() -> Result<(), Box<dyn Error>> {
        let beatmap = process_beatmap(&fs::read("./test_files/test.osu").await?).await?;
        let test_beatmap = Beatmap {
            accuracy: ModDecimal::new(1, 11.1, 10.0),
            approach_rate: ModDecimal::new(1, 11.0, 10.0),
            bpm: ModInteger::new(444.0, 296.0),
            circle_size: 5.0,
            difficulty_rating: ModDecimal::new(1, 0.0, 0.0),
            longest_stream: 81,
            performance_100: ModInteger::new(0.0, 0.0),
            performance_95: ModInteger::new(0.0, 0.0),
            streams_density: 0.1,
            streams_spacing: 0.41,
            streams_length: 71,
            total_length: 211,
        };
        compare_beatmaps(beatmap, test_beatmap);
        Ok(())
    }
    #[tokio::test]
    async fn test_no_streams() -> Result<(), Box<dyn Error>> {
        let beatmap = process_beatmap(&fs::read("./test_files/test_no_streams.osu").await?).await?;
        let test_beatmap = Beatmap {
            accuracy: ModDecimal::new(1, 7.1, 4.0),
            approach_rate: ModDecimal::new(1, 7.7, 5.0),
            bpm: ModInteger::new(270.0, 180.0),
            circle_size: 3.5,
            difficulty_rating: ModDecimal::new(1, 0.0, 0.0),
            longest_stream: 0,
            performance_100: ModInteger::new(0.0, 0.0),
            performance_95: ModInteger::new(0.0, 0.0),
            streams_density: 0.0,
            streams_spacing: 0.0,
            streams_length: 0,
            total_length: 258,
        };
        compare_beatmaps(beatmap, test_beatmap);
        Ok(())
    }
}
