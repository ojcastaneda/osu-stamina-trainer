import {ProcessingBeatmap, HitObjectInterval} from '../models/processingBeatmap';

class StreamProcessor {
	public static checkHitObjectIntervalIsStream = (hitObjectInterval: HitObjectInterval, beatmap: ProcessingBeatmap, currentBpmRangeIndex: number): boolean => {
		if (hitObjectInterval.distance - (54.4 - 4.48 * beatmap.cs) * 2 < 55)
			return (beatmap.bpmRanges[currentBpmRangeIndex].bpm * 4 - hitObjectInterval.bpm) < beatmap.bpmRanges[currentBpmRangeIndex].bpm * 0.2;
		return false;
	};

	public static checkBeatmapStreamCoefficient = (beatmap: ProcessingBeatmap) => {
		let highestBpm: number = 0, streamCoefficient: number = 0;
		for (const key in beatmap.bpmValues) {
			if (highestBpm < beatmap.bpmValues[key][0] && beatmap.bpmValues[key][1] > 0) highestBpm = beatmap.bpmValues[key][0];
			streamCoefficient += beatmap.bpmValues[key][1];
		}
		beatmap.bpm = highestBpm;
		beatmap.density = Number((streamCoefficient / (beatmap.hitObjectIntervals.length + 1)).toFixed(2));
		return beatmap.density >= 0.3;
	};

	public static calculateBeatmapAverage = (beatmap: ProcessingBeatmap) => {
		let averageWeightedStream: number;
		if (beatmap.streams.length > 1) {
			averageWeightedStream = 0;
			const sortedStreams = beatmap.streams.sort((first, second) => second.hitObjects - first.hitObjects);
			const divisionWeight = 1 / (sortedStreams.length - 1);
			for (let index = 0, length = sortedStreams.length; index < length; index++)
				averageWeightedStream += Math.pow(sortedStreams[index].hitObjects, 3) * (1 - divisionWeight * index) * 2 / length;
			beatmap.average = Math.round(Math.cbrt(averageWeightedStream));
		} else beatmap.average = beatmap.streams[0].hitObjects;
		return beatmap.average >= 3;
	};
}

export default StreamProcessor;