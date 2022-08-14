use super::models::{Beatmap, Interval, PredominantBpm, Stream, TimingPoint};
use std::cmp;

/// Estimates the most common bpm during streams using a weight system
fn calculate_bpm(beatmap: &mut Beatmap) -> bool {
    let mut current_weight = 0.0;
    for (bpm, statistics) in beatmap.bpm_frequencies.iter() {
        let bpm_weight = (*bpm as f64 / beatmap.predominant_bpm.bpm as f64)
            - (beatmap.predominant_bpm.frequency as f64 / statistics.streams as f64).sqrt();
        if *bpm < beatmap.predominant_bpm.bpm || bpm_weight < current_weight {
            continue;
        }
        current_weight = bpm_weight;
        beatmap.predominant_bpm = PredominantBpm::new(*bpm, statistics.streams);
    }
    let mut recalculate = false;
    beatmap.bpm_frequencies.iter().for_each(|(bpm, _)| {
        if *bpm - beatmap.predominant_bpm.bpm < -beatmap.predominant_bpm.bpm / 5 {
            beatmap.skipped_bpms.insert(*bpm);
            recalculate = true;
        }
    });
    recalculate
}

fn calculate_streams_statistics(beatmap: &mut Beatmap) {
    beatmap
        .streams
        .sort_by_key(|stream| cmp::Reverse(stream.length));
    let intervals = beatmap.streams_spacing;
    beatmap.streams_spacing = 0.0;
    let length = if beatmap.streams.len() > 1 {
        beatmap.streams.len()
    } else {
        1
    } as f64;
    let mut streams_length = 0.0;
    for (index, stream) in beatmap.streams.iter().enumerate() {
        if stream.length > beatmap.longest_stream {
            beatmap.longest_stream = stream.length
        }
        streams_length += (stream.length as f64).powi(3) * (1.0 - (index as f64 / length)) * 2.0
            / beatmap.streams.len() as f64;
        beatmap.streams_spacing += stream.spacing;
    }
    beatmap.streams_spacing /= intervals;
    beatmap.streams_length = streams_length.cbrt().round() as i16
}

fn filter_bpm(beatmap: &mut Beatmap, hit_objects: usize) -> bool {
    let mut intervals = 0;
    let mut recalculate = false;
    beatmap.bpm_frequencies.retain(|bpm, frequency| -> bool {
        if frequency.streams / 5 >= frequency.non_streams {
            intervals += frequency.streams;
            if frequency.streams > beatmap.predominant_bpm.frequency {
                beatmap.predominant_bpm = PredominantBpm::new(*bpm, frequency.streams)
            }
            return true;
        }
        if frequency.streams > 0 {
            beatmap.skipped_bpms.insert(*bpm);
            recalculate = true;
        }
        false
    });
    beatmap.streams_spacing = intervals as f64;
    beatmap.streams_density = intervals as f64 / (hit_objects - 1) as f64;
    recalculate
}

/// process a beatmap
pub fn process_beatmap(parsed_beatmap: &rosu_pp::Beatmap) -> Beatmap {
    let mut beatmap = Beatmap::new(parsed_beatmap.cs);
    let mut timing_points = Vec::<TimingPoint>::new();
    for timing_point in &parsed_beatmap.timing_points {
        if timing_point.beat_len.is_sign_negative() {
            continue;
        }
        timing_points.push(TimingPoint {
            bpm: (60000.0 / timing_point.beat_len).round(),
            start_time: timing_point.time,
        });
    }
    process_intervals(&mut beatmap, parsed_beatmap, &timing_points);
    while filter_bpm(&mut beatmap, parsed_beatmap.hit_objects.len()) || calculate_bpm(&mut beatmap)
    {
        beatmap.reset();
        process_intervals(&mut beatmap, parsed_beatmap, &timing_points);
    }
    calculate_streams_statistics(&mut beatmap);
    if beatmap.longest_stream > 1 {
        beatmap.longest_stream += 1;
        beatmap.streams_length += 1;
    } else {
        beatmap.predominant_bpm = PredominantBpm::new(parsed_beatmap.bpm().round() as i16, 0);
        beatmap.streams_spacing = 0.0;
    }
    beatmap.total_length =
        (parsed_beatmap.hit_objects[parsed_beatmap.hit_objects.len() - 1].start_time / 1000.0)
            .round() as i16;
    beatmap
}

///
fn process_intervals(
    beatmap: &mut Beatmap,
    parsed_beatmap: &rosu_pp::Beatmap,
    timing_points: &[TimingPoint],
) {
    let mut stream = Stream::default();
    let mut timing_point = 0;
    let mut hit_objects = parsed_beatmap.hit_objects.iter();
    let mut first_hit_object = hit_objects.next().unwrap();
    for hit_object in hit_objects {
        let interval = Interval::new(first_hit_object, hit_object);
        first_hit_object = hit_object;
        if timing_point + 1 < timing_points.len()
            && interval.start_time >= timing_points[timing_point + 1].start_time
        {
            timing_point += 1;
        }
        process_interval(
            beatmap,
            &interval,
            &mut stream,
            &timing_points[timing_point],
        );
    }
    terminate_stream(beatmap, &mut stream);
}

fn process_interval(
    beatmap: &mut Beatmap,
    interval: &Interval,
    stream: &mut Stream,
    timing_point: &TimingPoint,
) {
    let division = (interval.bpm / timing_point.bpm).round();
    if division >= 3.0 {
        let bpm = (timing_point.bpm * division / 4.0).round() as i16;
        let spacing = interval.spacing / (54.4 - 4.48 * beatmap.circle_size);
        if beatmap.skipped_bpms.contains(&bpm) || spacing > 4.0 {
            beatmap.update_bpm_frequencies(1, bpm, false);
        } else if stream.last_interval == 0
            || (bpm - stream.last_interval).abs() <= stream.last_interval / 5
        {
            beatmap.update_bpm_frequencies(1, bpm, true);
            stream.add_bpm_frequencies(bpm, spacing);
            return;
        } else {
            terminate_stream(beatmap, stream);
            process_interval(beatmap, interval, stream, timing_point);
            return;
        }
    }
    terminate_stream(beatmap, stream);
}

fn terminate_stream(beatmap: &mut Beatmap, stream: &mut Stream) {
    match stream.length {
        0 => return,
        1 => beatmap.update_bpm_frequencies(-1, stream.last_interval, true),
        _ => beatmap.streams.push(stream.clone()),
    }
    stream.reset();
}
