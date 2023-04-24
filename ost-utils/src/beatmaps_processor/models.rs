use rosu_pp::parse::HitObject;
use std::collections::{HashMap, HashSet};

/// A struct representing a beatmap.
pub struct Beatmap {
    /// The BPM frequencies for each BPM in the beatmap
    pub bpm_frequencies: HashMap<i16, BpmFrequency>,
    /// The circle size of the beatmap
    pub circle_size: f64,
    /// The length of the longest stream in the beatmap
    pub longest_stream: i16,
    /// The predominant BPM of the beatmap
    pub predominant_bpm: PredominantBpm,
    /// The BPMs that were skipped when processing the beatmap
    pub skipped_bpms: HashSet<i16>,
    /// The streams in the beatmap
    pub streams: Vec<Stream>,
    /// The density of streams in the beatmap
    pub streams_density: f64,
    /// The total length of streams in the beatmap
    pub streams_length: i16,
    /// The total spacing between streams in the beatmap
    pub streams_spacing: f64,
    /// The total length of the beatmap
    pub total_length: i16,
}

impl Beatmap {
    /// Creates a new [`Beatmap`] with the specified circle size
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
            total_length: 0,
        }
    }

    /// Resets all data in the [`Beatmap`] to its default values
    pub fn reset(&mut self) {
        self.bpm_frequencies = HashMap::new();
        self.longest_stream = 0;
        self.predominant_bpm = PredominantBpm::new(0, 0);
        self.streams = Vec::new();
        self.streams_density = 0.0;
        self.streams_length = 0;
        self.streams_spacing = 0.0;
    }

    /// Updates the `bpm_frequencies` in the [`Beatmap`] based on whether the frequency is from a stream or not
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

/// A struct representing a Stream in the [`Beatmap`]
#[derive(Clone, Default)]
pub struct Stream {
    /// A HashMap that contains the BPM frequencies of the stream
    pub bpm_frequencies: HashMap<i16, i16>,
    /// The last interval of the stream
    pub last_interval: i16,
    /// The length of the stream
    pub length: i16,
    /// The total spacing of the stream
    pub spacing: f64,
}

impl Stream {
    /// Adds the BPM frequency and spacing to the [`Stream`]
    pub fn add_bpm_frequencies(&mut self, bpm: i16, spacing: f64) {
        self.bpm_frequencies
            .insert(bpm, self.bpm_frequencies.get(&bpm).unwrap_or(&0) + 1);
        self.last_interval = bpm;
        self.length += 1;
        self.spacing += spacing;
    }

    /// Resets the state of the [`Stream`]
    pub fn reset(&mut self) {
        self.bpm_frequencies = HashMap::default();
        self.length = 0;
        self.last_interval = 0;
        self.spacing = 0.0;
    }
}

/// A struct representing an interval in a [`Beatmap`], defined by the BPM,
/// start time, end time, and spacing between two [`HitObject`]s.
pub struct Interval {
    /// The BPM value for the interval
    pub bpm: f64,
    /// The end time of the interval, in milliseconds
    pub end_time: f64,
    /// The spacing between the two `HitObject`s that define the interval, in pixels
    pub spacing: f64,
    /// The start time of the interval, in milliseconds
    pub start_time: f64,
}

impl Interval {
    /// Creates a new [`Interval`] instance based on two [`HitObject`]s.
    pub fn new(first: &HitObject, second: &HitObject) -> Self {
        Self {
            bpm: 60000.0 / (second.start_time - first.start_time),
            end_time: second.start_time,
            spacing: second.pos.distance(first.pos) as f64,
            start_time: first.start_time,
        }
    }
}

/// A struct representing a frequency of BPM in a beatmap, divided into two categories: non-streams and streams.
pub struct BpmFrequency {
    /// The frequency of BPM in non-streams
    pub non_streams: i16,
    /// The frequency of BPM in streams
    pub streams: i16,
}

impl BpmFrequency {
    /// Creates a new [`BpmFrequency`] instance with the given non-streams and streams frequency values.
    pub fn new(non_streams: i16, streams: i16) -> Self {
        Self {
            non_streams,
            streams,
        }
    }
}

/// A struct representing the predominant BPM (beats per minute) in a beatmap.
pub struct PredominantBpm {
    /// The BPM value
    pub bpm: i16,
    /// The frequency at which the BPM occurs
    pub frequency: i16,
}

impl PredominantBpm {
    /// Creates a new [`PredominantBpm`] instance with the given BPM and frequency values.
    pub fn new(bpm: i16, frequency: i16) -> Self {
        Self { bpm, frequency }
    }
}
