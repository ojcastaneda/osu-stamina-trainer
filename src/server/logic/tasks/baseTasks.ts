import Beatmap, {createBeatmap, createDoubleTimeBeatmap, retrieveBeatmap, updateBeatmap} from '../../models/beatmap';
import {process_beatmap} from 'ost-wasm-utils';
import {readFileAsync} from '../fileManager';

/**
 * Process a beatmap and indicates whether or not the stream statistics of the beatmap meet the requirements.
 *
 * @param beatmap - The beatmap to process.
 * @param isSubmission - The indication to whether or not it is a submission.
 * @returns A promise of whether or not the beatmap meet the stream statistics requirements.
 */
const processBeatmap = async (beatmap: Beatmap, verificationDate: Date, isSubmission: boolean = false): Promise<boolean> => {
	beatmap.last_verified = verificationDate;
	const doubleTimeBeatmap = await calculateStreamStatistics(beatmap);
	if (beatmap.stream_density! >= 0.3 && beatmap.stream_length! >= 3 && beatmap.difficulty_rating! >= 3) {
		if (await retrieveBeatmap(beatmap.id!, ['id']) === undefined) {
			await createBeatmap(beatmap, doubleTimeBeatmap, isSubmission);
		} else {
			await updateBeatmap(beatmap, doubleTimeBeatmap);
		}
		return true;
	}
	return false;
};

/**
 * Applies the stream detection algorithm to the beatmap and returns the statistics corresponding to the double time version of the beatmap.
 *
 * @param beatmap - The beatmap to process.
 * @returns A promise of the double time statistics of the beatmap.
 */
const calculateStreamStatistics = async (beatmap: Beatmap): Promise<Beatmap> => {
	const processedBeatmap = process_beatmap(await readFileAsync(`beatmaps/${beatmap.id}.osu`), 130);
	if (processedBeatmap === undefined) throw Error;
	beatmap.bpm = processedBeatmap.suggested_bpm;
	beatmap.stream_length = Math.round(processedBeatmap.average_stream_length);
	beatmap.stream_density = Number(processedBeatmap.stream_density.toFixed(2));
	return createDoubleTimeBeatmap(beatmap.bpm, beatmap.hit_length!, processedBeatmap.od_double_time, processedBeatmap.ar_double_time,
		processedBeatmap.difficulty_double_time);
};

export {processBeatmap};
