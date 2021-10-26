import ApiService from '../services/api';
import OsuService from '../services/osu';
import {ProcessingBeatmap} from '../models/processingBeatmap';
import BeatmapProcessor from '../beatmapProcessing/beatmapProcessor';
import Beatmap from '../models/api/beatmap';
import OppaiInterpreter from '../beatmapProcessing/oppaiInterpreter';
import PQueue from 'p-queue';
import util from 'util';
import fs from 'fs';

const readFileAsync = util.promisify(fs.readFile);

class BaseTask {

	protected apiService: ApiService;

	protected osuService: OsuService;

	protected promiseQueue: PQueue;

	constructor() {
		this.apiService = new ApiService();
		this.osuService = new OsuService();
		this.promiseQueue = new PQueue({interval: 1000, intervalCap: 8, concurrency: 8});
	}

	protected processBeatmap = async (beatmap: ProcessingBeatmap, isSubmission: boolean = false): Promise<boolean> => {
		try {
			const file = await readFileAsync(`beatmaps/${beatmap.id}.osu`);
			return BeatmapProcessor.processBeatmap(file.toString('utf-8').split('\n'), beatmap) && beatmap.bpm >= 130 &&
				await this.apiService.createBeatmap(new Beatmap(beatmap), await OppaiInterpreter.calculateDoubleTimeStatistics(beatmap), isSubmission);
		} catch (error) {
			return false;
		}
	};
}

export default BaseTask;