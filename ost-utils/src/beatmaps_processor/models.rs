use rosu_pp::parse::HitObject;
use std::collections::{HashMap, HashSet};

/// Represents the information required to process a beatmap with the streams
/// processor.
pub struct Beatmap {
    pub bpm_frequencies: HashMap<i16, BpmFrequency>,
    pub circle_size: f64,
    pub longest_stream: i16,
    pub predominant_bpm: PredominantBpm,
    pub skipped_bpms: HashSet<i16>,
    pub streams: Vec<Stream>,
    pub streams_density: f64,
    pub streams_length: i16,
    pub streams_spacing: f64,
}

impl Beatmap {
    /// Constructs a new beatmap with default values.
    pub fn new(cs: f32) -> Self {
        Self {
            bpm_frequencies: HashMap::new(),
            circle_size: cs as f64,
            longest_stream: 0,
            predominant_bpm: PredominantBpm::new(0, 0),
            skipped_bpms: HashSet::new(),
            streams: Vec::new(),
            streams_density: 0.0,
            streams_length: 0,
            streams_spacing: 0.0,
        }
    }

    pub fn reset(&mut self) {
        self.bpm_frequencies = HashMap::new();
        self.longest_stream = 0;
        self.predominant_bpm = PredominantBpm::new(0, 0);
        self.streams = Vec::new();
        self.streams_density = 0.0;
        self.streams_length = 0;
        self.streams_spacing = 0.0;
    }

    pub fn update_bpm_frequencies(&mut self, added_frequency: i16, bpm: i16, is_stream: bool) {
        self.bpm_frequencies.insert(
            bpm,
            match (self.bpm_frequencies.get(&bpm), is_stream) {
                (Some(bpm_frequency), true) => BpmFrequency::new(
                    bpm_frequency.non_streams,
                    bpm_frequency.streams + added_frequency,
                ),
                (Some(frequency), false) => {
                    BpmFrequency::new(frequency.non_streams + added_frequency, frequency.streams)
                }
                (None, true) => BpmFrequency::new(0, added_frequency),
                (None, false) => BpmFrequency::new(added_frequency, 0),
            },
        );
    }
}

#[derive(Clone, Default)]
pub struct Stream {
    pub bpm_frequencies: HashMap<i16, i16>,
    pub last_interval: i16,
    pub length: i16,
    pub spacing: f64,
}

impl Stream {
    pub fn add_bpm_frequencies(&mut self, bpm: i16, spacing: f64) {
        self.bpm_frequencies
            .insert(bpm, self.bpm_frequencies.get(&bpm).unwrap_or(&0) + 1);
        self.last_interval = bpm;
        self.length += 1;
        self.spacing += spacing;
    }

    pub fn reset(&mut self) {
        self.bpm_frequencies = HashMap::default();
        self.length = 0;
        self.last_interval = 0;
        self.spacing = 0.0;
    }
}

pub struct Interval {
    pub bpm: f64,
    pub end_time: f64,
    pub spacing: f64,
    pub start_time: f64,
}

impl Interval {
    pub fn new(first_hit_object: &HitObject, second_hit_object: &HitObject) -> Self {
        let x_distance = (first_hit_object.pos.x - second_hit_object.pos.x) as f64;
        let y_distance = (first_hit_object.pos.y - second_hit_object.pos.y) as f64;
        Self {
            bpm: 60000.0 / (second_hit_object.start_time - first_hit_object.start_time),
            end_time: second_hit_object.start_time,
            spacing: ((x_distance.powi(2) + y_distance.powi(2)).sqrt() * 100.0).round() / 100.0,
            start_time: first_hit_object.start_time,
        }
    }
}

pub struct BpmFrequency {
    pub non_streams: i16,
    pub streams: i16,
}

impl BpmFrequency {
    pub fn new(non_streams: i16, streams: i16) -> Self {
        Self {
            non_streams,
            streams,
        }
    }
}

pub struct PredominantBpm {
    pub bpm: i16,
    pub frequency: i16,
}

impl PredominantBpm {
    pub fn new(bpm: i16, frequency: i16) -> Self {
        Self { bpm, frequency }
    }
}

pub struct TimingPoint {
    pub bpm: f64,
    pub start_time: f64,
}
