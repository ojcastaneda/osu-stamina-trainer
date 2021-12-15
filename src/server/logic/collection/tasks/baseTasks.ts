import Beatmap, { createBeatmap, createDoubleTimeBeatmap, updateBeatmap } from '../../../models/beatmap';
import { process_beatmap } from 'osu-stream-detector';
import { readFileAsync } from '../../fileManager';

/**
 * Process a beatmap and indicates whether or not the stream statistics of the beatmap meet the requirements.
 * 
 * @param beatmap - The beatmap to process.
 * @param isSubmission - The indication to whether or not it is a submission.
 * @returns A promise of whether or not the beatmap meet the stream statistics requirements.
 */
const 	processBeatmap = async (beatmap: Beatmap, isSubmission: boolean = false): Promise<boolean> => {
	const doubleTimeBeatmap = await calculateStreamStatistics(beatmap);
	if (beatmap.bpm! >= 130 && beatmap.density! >= 0.3 && beatmap.average! >= 3) {
		if (!(await updateBeatmap(beatmap, doubleTimeBeatmap))) await createBeatmap(beatmap, doubleTimeBeatmap, isSubmission);
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
	beatmap.average = Math.round(processedBeatmap.average_stream_length);
	beatmap.density = Number(processedBeatmap.stream_density.toFixed(2));
	return createDoubleTimeBeatmap(beatmap.bpm, beatmap.length!, {
		ar: processedBeatmap.ar_double_time,
		od: processedBeatmap.od_double_time,
		stars: processedBeatmap.difficulty_double_time
	});
};

export { processBeatmap };
