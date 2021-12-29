use crate::stream_detector::models::{Beatmap, BpmValue};
use std::cmp;

pub fn calculate_estimated_bpm(beatmap: &mut Beatmap) -> Vec<BpmValue> {
    let mut bpm_values: Vec<BpmValue> = beatmap.bpm_values.values().cloned().collect();
    bpm_values.sort_by_key(|bpm_value| cmp::Reverse(bpm_value.bpm));
    let mut index: usize = 0;
    while beatmap.suggested_bpm.bpm == 0 && index < bpm_values.len() {
        if (1.5 + (beatmap.density * 0.5))
            * (bpm_values[index].bpm as f64 / beatmap.most_common_bpm.bpm as f64).powf(1.6)
            * bpm_values[index].amount as f64
            > beatmap.most_common_bpm.amount as f64
        {
            beatmap.suggested_bpm = BpmValue {
                bpm: bpm_values[index].bpm,
                amount: bpm_values[index].amount,
            };
        }
        index += 1;
    }
    return bpm_values;
}
