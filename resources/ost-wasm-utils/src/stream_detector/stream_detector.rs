use crate::stream_detector::models::{Beatmap, BpmRange, BpmValue, HitObjectInterval, Stream};
use std::{cmp, collections::HashMap, ops::Neg};

pub fn process_beatmap(parsed_beatmap: &rosu_pp::Beatmap, range: (i32, i32)) -> Beatmap {
    let mut beatmap: Beatmap = Beatmap::new();
    beatmap.cs = parsed_beatmap.cs;
    for timing_point in &parsed_beatmap.timing_points {
        if timing_point.beat_len.is_sign_positive() {
            beatmap.bpm_ranges.push(BpmRange::new(
                timing_point.time as u32,
                (60000.0 / timing_point.beat_len).round() as u32,
            ));
        }
    }
    process_hit_objects(parsed_beatmap, &mut beatmap, range);
    calculate_stream_density(&mut beatmap);
    calculate_average_stream_length(&mut beatmap);
    return beatmap;
}

fn process_hit_objects(parsed_beatmap: &rosu_pp::Beatmap, beatmap: &mut Beatmap, range: (i32, i32)) {
    let mut stream_index: usize = 0;
    let mut bpm_range_index: usize = 0;
    beatmap.streams.push(Stream::new());
    for (index, hit_object) in parsed_beatmap.hit_objects.iter().enumerate() {
        let first_hit_object = hit_object;
        let next_hit_object = parsed_beatmap.hit_objects.get(index + 1);
        if next_hit_object.is_none() {
            break;
        }
        let second_hit_object = next_hit_object.unwrap();
        let hit_object_interval: HitObjectInterval =
            HitObjectInterval::new(first_hit_object, second_hit_object);
        if bpm_range_index + 1 < beatmap.bpm_ranges.len()
            && hit_object_interval.time.1 > beatmap.bpm_ranges[bpm_range_index + 1].time
        {
            bpm_range_index += 1;
        }
        process_hit_object_interval(
            &hit_object_interval,
            beatmap,
            &mut bpm_range_index,
            &mut stream_index,
            range,
        );
        beatmap.hit_object_interval.push(hit_object_interval);
    }
    if beatmap.streams[stream_index].hit_objects < 3 {
        beatmap.update_bpm_values(
            beatmap.streams[stream_index].max_bpm_change,
            (beatmap.streams[stream_index].hit_objects as i32).neg(),
        );
        beatmap.streams.pop();
    }
}

fn process_hit_object_interval(
    hit_object_interval: &HitObjectInterval,
    beatmap: &mut Beatmap,
    bpm_range_index: &mut usize,
    stream_index: &mut usize,
    range: (i32, i32),
) {
    let bpm_fraction: u32 = (hit_object_interval.bpm as f64
        / beatmap.bpm_ranges[*bpm_range_index].bpm as f64)
        .round() as u32;
    if hit_object_interval.distance - (54.4 - 4.48 * beatmap.cs) * 2.0 < 50.0 {
        if bpm_fraction == 4
            && beatmap.bpm_ranges[*bpm_range_index].bpm as i32 >= range.0
            && beatmap.bpm_ranges[*bpm_range_index].bpm as i32 <= range.1
        {
            let mut amount: i32 = 1;
            if beatmap.streams[*stream_index].hit_objects == 0 {
                amount += 1;
            }
            beatmap.streams[*stream_index]
                .update_bpm_change(beatmap.bpm_ranges[*bpm_range_index].bpm, amount);
            beatmap.streams[*stream_index].last_bpm_added =
                beatmap.bpm_ranges[*bpm_range_index].bpm;
            beatmap.update_bpm_values(beatmap.bpm_ranges[*bpm_range_index].bpm, amount as i32);
            return;
        } else if bpm_fraction > 4 {
            if *bpm_range_index > 0
                && hit_object_interval.time.0 == beatmap.bpm_ranges[*bpm_range_index].time
                && (hit_object_interval.bpm as f64
                    / beatmap.bpm_ranges[*bpm_range_index - 1].bpm as f64)
                    .round() as u32
                    == 4
            {
                beatmap.bpm_ranges[*bpm_range_index].time = hit_object_interval.time.1;
                beatmap.streams[*stream_index]
                    .update_bpm_change(beatmap.bpm_ranges[*bpm_range_index - 1].bpm, 1);
                beatmap.update_bpm_values(beatmap.bpm_ranges[*bpm_range_index - 1].bpm, 1);
            } else {
                let new_bpm_range =
                    ((bpm_fraction as f64 * beatmap.bpm_ranges[*bpm_range_index].bpm as f64) / 4.0)
                        .round() as u32;
                if new_bpm_range as i32 >= range.0 && new_bpm_range as i32 <= range.1 {
                    let previous_bpm: u32 = beatmap.bpm_ranges[*bpm_range_index].bpm;
                    if beatmap.bpm_ranges[*bpm_range_index].time != hit_object_interval.time.0 {
                        *bpm_range_index += 1;
                    }
                    beatmap.bpm_ranges.insert(
                        *bpm_range_index,
                        BpmRange::new(hit_object_interval.time.0, new_bpm_range),
                    );
                    if *bpm_range_index + 1 >= beatmap.bpm_ranges.len()
                        || hit_object_interval.time.1
                            != beatmap.bpm_ranges[*bpm_range_index + 1].time
                    {
                        beatmap.bpm_ranges.insert(
                            *bpm_range_index + 1,
                            BpmRange::new(hit_object_interval.time.1, previous_bpm),
                        );
                    }
                    let mut amount: i32 = 1;
                    if beatmap.streams[*stream_index].hit_objects == 0 {
                        amount += 1;
                    } else if beatmap.streams[*stream_index].last_bpm_added
                        < beatmap.bpm_ranges[*bpm_range_index].bpm
                    {
                        amount += 1;
                        beatmap.streams[*stream_index]
                            .update_bpm_change(beatmap.bpm_ranges[*bpm_range_index - 1].bpm, -1);
                        beatmap.update_bpm_values(beatmap.bpm_ranges[*bpm_range_index - 1].bpm, -1);
                    }
                    beatmap.streams[*stream_index]
                        .update_bpm_change(beatmap.bpm_ranges[*bpm_range_index].bpm, amount);
                    beatmap
                        .update_bpm_values(beatmap.bpm_ranges[*bpm_range_index].bpm, amount as i32);
                }
            }
            beatmap.streams[*stream_index].last_bpm_added =
                beatmap.bpm_ranges[*bpm_range_index].bpm;
            return;
        }
    } else {
        beatmap.update_non_stream_hit_objects(
            ((bpm_fraction as f64 * beatmap.bpm_ranges[*bpm_range_index].bpm as f64) / 4.0).round()
                as u32,
            1,
        );
    }
    if beatmap.streams[*stream_index].hit_objects < 3 {
        beatmap.update_bpm_values(
            beatmap.streams[*stream_index].max_bpm_change,
            (beatmap.streams[*stream_index].hit_objects as i32).neg(),
        );
        beatmap.streams[*stream_index] = Stream::new();
    } else {
        beatmap.streams.push(Stream::new());
        *stream_index += 1;
    }
}

fn calculate_average_stream_length(beatmap: &mut Beatmap) {
    let length: usize = beatmap.streams.len();
    match length {
        0 => beatmap.average_stream_length = 0,
        1 => beatmap.average_stream_length = beatmap.streams[0].hit_objects,
        _ => {
            let mut weighted_average: f64 = 0.0;
            beatmap
                .streams
                .sort_by_key(|stream| cmp::Reverse(stream.hit_objects));
            for (index, stream) in beatmap.streams.iter().enumerate() {
                weighted_average += (stream.hit_objects).pow(3) as f64
                    * (1.0 - (index as f64 / (length - 1) as f64))
                    * 2.0
                    / (length as f64);
            }
            beatmap.average_stream_length = weighted_average.cbrt().round() as u32;
        }
    }
}

fn calculate_stream_density(beatmap: &mut Beatmap) {
    let mut most_common_bpm: BpmValue = BpmValue {
        bpm: u32::MIN,
        amount: u32::MIN,
    };
    let mut stream_hit_objects: u32 = 0;
    let mut new_bpm_values: HashMap<u32, BpmValue> = HashMap::new();
    for bpm_value in beatmap.bpm_values.values() {
        let non_stream_hit_objects = beatmap.non_stream_hit_objects.get(&bpm_value.bpm);
        if non_stream_hit_objects.is_none()
            || non_stream_hit_objects.unwrap() * 3 < bpm_value.amount
        {
            if bpm_value.amount > most_common_bpm.amount && bpm_value.amount > 3 {
                most_common_bpm = BpmValue {
                    bpm: bpm_value.bpm,
                    amount: bpm_value.amount,
                };
            }
            stream_hit_objects += bpm_value.amount;
            new_bpm_values.insert(bpm_value.bpm, (*bpm_value).clone());
        }
    }
    beatmap.bpm_values = new_bpm_values;
    beatmap.most_common_bpm = most_common_bpm;
    beatmap.density = stream_hit_objects as f64 / (beatmap.hit_object_interval.len() + 1) as f64;
}
