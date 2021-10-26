import {ProcessingBeatmap, BpmRange, HitObjectInterval, Stream} from '../models/processingBeatmap';
import StreamProcessor from './streamProcessor';

class BeatmapProcessor {

	public static processBeatmap = (fileLines: string[], beatmap: ProcessingBeatmap) => {
		let index = 0;
		for (const length = fileLines.length; index < length; index++) {
			if (fileLines[index].startsWith('[TimingPoints]')) {
				index++;
				index = BeatmapProcessor.processTimingPoints(fileLines, beatmap, index);
				break;
			}
		}
		for (const length = fileLines.length; index < length; index++)
			if (fileLines[index].startsWith('[HitObjects]')) {
				index++;
				index = BeatmapProcessor.processHitObjects(fileLines, beatmap, index);
				break;
			}
		return beatmap.streams.length > 0 && StreamProcessor.checkBeatmapStreamCoefficient(beatmap) && StreamProcessor.calculateBeatmapAverage(beatmap);
	};

	private static processTimingPoints = (fileLines: string[], beatmap: ProcessingBeatmap, index: number): number => {
		let timingPoint: string[], beatLength: number;
		for (let length = fileLines.length; index < length; index++) {
			if (fileLines[index].startsWith('\r')) return index;
			timingPoint = fileLines[index].split(',');
			beatLength = Number(timingPoint[1]);
			if (beatLength > 0)
				beatmap.bpmRanges.push(new BpmRange(Math.round(Number(timingPoint[0])), Math.round(60000 / beatLength)));
		}
		return index;
	};

	private static processHitObjects = (fileLines: string[], beatmap: ProcessingBeatmap, index: number) => {
		let firstHitObject: string[], secondHitObject: string[], hitObjectInterval: HitObjectInterval,
			currentBpmRangeValue: number;
		beatmap.streams.push(new Stream());
		let currentStreamIndex: number = 0, currentBpmRangeIndex: number = 0;
		for (const length = fileLines.length; index < length; index++) {
			try {
				firstHitObject = fileLines[index].split(',');
				secondHitObject = fileLines[index + 1].split(',');
				hitObjectInterval = new HitObjectInterval(Math.round(Number(secondHitObject[2])),
					Math.round(60000 / (Number(secondHitObject[2]) - Number(firstHitObject[2]))),
					[Number(firstHitObject[0]), Number(firstHitObject[1])], [Number(secondHitObject[0]), Number(secondHitObject[1])]);
				currentBpmRangeValue = beatmap.bpmRanges[currentBpmRangeIndex].bpm;
				beatmap.hitObjectIntervals.push(hitObjectInterval);
				if (currentBpmRangeIndex + 1 < beatmap.bpmRanges.length && hitObjectInterval.time > beatmap.bpmRanges[currentBpmRangeIndex + 1].time) {
					currentBpmRangeIndex++;
					beatmap.streams[currentStreamIndex].updateBpmChange(currentBpmRangeValue, 0);
					currentBpmRangeValue = beatmap.bpmRanges[currentBpmRangeIndex].bpm;
				}
				if (StreamProcessor.checkHitObjectIntervalIsStream(hitObjectInterval, beatmap, currentBpmRangeIndex)) {
					let amount: number = 1;
					if (beatmap.streams[currentStreamIndex].hitObjects === 0) amount = 2;
					beatmap.streams[currentStreamIndex].updateBpmChange(currentBpmRangeValue, amount);
					beatmap.updateStreamBpmFrequency(currentBpmRangeValue, amount);
					beatmap.streams[currentStreamIndex].updateHitObjects(amount);
				} else {
					if (beatmap.streams[currentStreamIndex].hitObjects < 3) {
						BeatmapProcessor.removeBpmFrequencyStream(beatmap, currentStreamIndex);
						beatmap.streams[currentStreamIndex] = new Stream();
					} else {
						BeatmapProcessor.filterBpmChanges(beatmap, currentStreamIndex);
						currentStreamIndex++;
						beatmap.streams.push(new Stream());
					}
				}
			} catch (error) {
				if (beatmap.streams[currentStreamIndex].hitObjects < 3)
					BeatmapProcessor.removeBpmFrequencyStream(beatmap, currentStreamIndex);
				else BeatmapProcessor.filterBpmChanges(beatmap, currentStreamIndex);
				return index;
			}
		}
		return index;
	};

	private static filterBpmChanges = (beatmap: ProcessingBeatmap, currentStreamIndex: number) => {
		for (const key in beatmap.streams[currentStreamIndex].bpmChanges)
			if (beatmap.streams[currentStreamIndex].bpmChanges[key][1] < 3) {
				beatmap.updateStreamBpmFrequency(beatmap.streams[currentStreamIndex].maxBpmChanges[0],
					beatmap.streams[currentStreamIndex].bpmChanges[key][1]);
				beatmap.updateStreamBpmFrequency(beatmap.streams[currentStreamIndex].bpmChanges[key][0],
					-beatmap.streams[currentStreamIndex].bpmChanges[key][1]);
			}
	};

	private static removeBpmFrequencyStream = (beatmap: ProcessingBeatmap, currentStreamIndex: number) => {
		for (const key in beatmap.streams[currentStreamIndex].bpmChanges)
			beatmap.updateStreamBpmFrequency(beatmap.streams[currentStreamIndex].bpmChanges[key][0], -beatmap.streams[currentStreamIndex].bpmChanges[key][1]);
	};
}

export default BeatmapProcessor;