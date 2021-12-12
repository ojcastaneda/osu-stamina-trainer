import StreamDetector from '../interpreters/streamDetectorInterpreter';
import OsuService from '../../../../osuApi/osuApiService';
import Beatmap from '../../../models/beatmap';
import PQueue from 'p-queue';

class BaseTask {
	protected osuService: OsuService;

	protected promiseQueue: PQueue;

	constructor() {
		this.osuService = new OsuService();
		this.promiseQueue = new PQueue({ interval: 1000, intervalCap: 8, concurrency: 8 });
	}

	protected processBeatmap = async (beatmap: Beatmap, isSubmission: boolean = false): Promise<boolean> => {
		try {
			const doubleTimeBeatmap = await StreamDetector.calculateStreamStatistics(beatmap);
			if (beatmap.bpm! >= 130 && beatmap.density! >= 0.3 && beatmap.average! >= 3) {
				if ((await Beatmap.updateBeatmap(beatmap, doubleTimeBeatmap)) === 0)
					await Beatmap.createBeatmap(beatmap, doubleTimeBeatmap, isSubmission);
				return true;
			}
			return false;
		} catch (error) {
			return false;
		}
	};
}

export default BaseTask;
