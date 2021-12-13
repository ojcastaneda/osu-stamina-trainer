import { process_beatmap } from 'osu-stream-detector';
import Beatmap from '../../../models/beatmap';
import { promisify } from 'util';
import { readFile } from 'fs';

const readFileAsync = promisify(readFile);

class StreamDetectorInterpreter {
	public static calculateStreamStatistics = async (beatmap: Beatmap): Promise<Beatmap> => {
		const processedBeatmap = process_beatmap(await readFileAsync(`beatmaps/${beatmap.id!}.osu`), 130);
		if (processedBeatmap === undefined) throw Error;
		beatmap.bpm = processedBeatmap.suggested_bpm;
		beatmap.average = Math.round(processedBeatmap.average_stream_length);
		beatmap.density = Number(processedBeatmap.stream_density.toFixed(2));
		return Beatmap.createDoubleTimeBeatmap(beatmap.bpm, beatmap.length!, {
			ar: processedBeatmap.ar_double_time,
			od: processedBeatmap.od_double_time,
			stars: processedBeatmap.difficulty_double_time
		});
	};
}

export default StreamDetectorInterpreter;
