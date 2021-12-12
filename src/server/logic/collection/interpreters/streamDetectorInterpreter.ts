import { process_beatmap } from '../../../../../resources/osu-stream-detector/osu_stream_detector';
import Beatmap from '../../../models/beatmap';

class StreamDetectorInterpreter {
	public static calculateStreamStatistics = async (beatmap: Beatmap): Promise<Beatmap> => {
		const processedBeatmap = await process_beatmap(`beatmaps/${beatmap.id}.osu`, 130);
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
