use super::{HitObjectInterval, Stream};
use std::collections::HashMap;

#[derive(Debug)]
pub struct Beatmap {
    pub cs: f32,
    pub density: f64,
    pub most_common_bpm: BpmValue,
    pub suggested_bpm: BpmValue,
    pub average_stream_length: u32,
    pub hit_object_interval: Vec<HitObjectInterval>,
    pub non_stream_hit_objects: HashMap<u32, u32>,
    pub bpm_values: HashMap<u32, BpmValue>,
    pub bpm_ranges: Vec<BpmRange>,
    pub streams: Vec<Stream>,
}

impl Beatmap {
    pub fn new() -> Self {
        Self {
            cs: f32::MAX,
            density: f64::MAX,
            most_common_bpm: BpmValue {
                bpm: u32::MIN,
                amount: u32::MIN,
            },
            suggested_bpm: BpmValue {
                bpm: u32::MIN,
                amount: u32::MIN,
            },
            average_stream_length: u32::MAX,
            hit_object_interval: Vec::new(),
            non_stream_hit_objects: HashMap::new(),
            bpm_values: HashMap::new(),
            bpm_ranges: Vec::new(),
            streams: Vec::new(),
        }
    }

    pub fn update_non_stream_hit_objects(&mut self, bpm: u32, amount: u32) {
        let non_stream_hit_object: Option<&u32> = self.non_stream_hit_objects.get(&bpm);
        let new_amount: u32;
        if non_stream_hit_object.is_some() {
            new_amount = non_stream_hit_object.unwrap() + amount;
        } else {
            new_amount = amount;
        }
        self.non_stream_hit_objects.insert(bpm, new_amount);
    }

    pub fn update_bpm_values(&mut self, bpm: u32, amount: i32) {
        let bpm_value: Option<&BpmValue> = self.bpm_values.get(&bpm);
        let new_bpm_amount: i32;
        if bpm_value.is_some() {
            new_bpm_amount = bpm_value.unwrap().amount as i32 + amount;
        } else {
            new_bpm_amount = amount;
        }
        if new_bpm_amount.is_positive() {
            self.bpm_values.insert(
                bpm,
                BpmValue {
                    bpm,
                    amount: new_bpm_amount as u32,
                },
            );
        } else {
            self.bpm_values.remove(&bpm);
        }
    }
}

#[derive(Debug, Clone)]
pub struct BpmValue {
    pub amount: u32,
    pub bpm: u32,
}

#[derive(Debug)]
pub struct BpmRange {
    pub time: u32,
    pub bpm: u32,
}

impl BpmRange {
    pub fn new(time: u32, bpm: u32) -> Self {
        Self { time, bpm }
    }
}
