import HonoredBeatmap from '../models/api/honoredBeatmap';
import Beatmap from '../models/api/beatmap';
import BaseTask from './baseTask';
import util from 'util';
import fs from 'fs';

const writeFileAsync = util.promisify(fs.writeFile);

class SubmissionsProcessor extends BaseTask {
	public approveSubmissions = async () => {
		console.log('Approve submissions start');
		if (!fs.existsSync('beatmaps'))
			fs.mkdirSync('beatmaps');
		await this.apiService.retrieveToken();
		await this.osuService.retrieveToken();
		const honoredBeatmaps = await this.apiService.retrievePendingHonoredBeatmaps();
		for (let index = 0, length = honoredBeatmaps.length; index < length; index++) {
			this.promiseQueue.add(async () => {
				try {
					const beatmap = await this.osuService.retrieveBeatmap(honoredBeatmaps[index].id);
					if (beatmap !== undefined) await this.apiService.createHonoredBeatmap(new HonoredBeatmap(beatmap));
				} catch (error) {
					console.log(error);
				}
			});
		}
		await this.promiseQueue.onIdle();
		const beatmaps = await this.apiService.retrievePendingBeatmapsFromSubmissions();
		for (let index = 0, length = beatmaps.length; index < length; index++) {
			this.promiseQueue.add(async () => {
				try {
					const beatmap = await this.osuService.retrieveBeatmap(beatmaps[index].id);
					if (beatmap !== undefined) {

						await writeFileAsync(`beatmaps/${beatmaps[index].id}.osu`, (await this.apiService.downloadSubmission(beatmaps[index].id))!);
						await this.processBeatmap(beatmap, true);
						if (beatmap.rankedStatus === 'ranked') await this.apiService.rankSubmission(beatmap.id);
					}
				} catch (error) {
					console.log(error);
				}
			});
		}
		await this.promiseQueue.onIdle();
		await this.apiService.updateCollection();
		console.log('Approve submissions end');
	};

	public checkSubmissionsLastUpdate = async () => {
		console.log('Submissions update start');
		await this.apiService.retrieveToken();
		await this.osuService.retrieveToken();
		await this.checkSubmissionLastUpdate(await this.apiService.retrieveBeatmapsFromSubmissions());
		await this.checkSubmissionLastUpdate(await this.apiService.retrieveHonoredBeatmaps());
		console.log('Submissions update end');
	};

	private checkSubmissionLastUpdate = async (beatmaps: HonoredBeatmap[] | Beatmap[]) => {
		for (let index = 0, length = beatmaps.length; index < length; index++) {
			this.promiseQueue.add(async () => {
				try {
					const beatmap = await this.osuService.retrieveBeatmap(beatmaps[index].id);
					if (beatmap === undefined) await this.apiService.deleteSubmission(beatmaps[index].id);
					else if (beatmap.lastUpdated > new Date(beatmaps[index].last_updated!)) {
						await this.apiService.deleteSubmission(beatmaps[index].id);
						await this.apiService.resubmitSubmission(beatmaps[index].id);
					}
				} catch (error) {
					console.log(error);
				}
			});
		}
		await this.promiseQueue.onIdle();
		await this.apiService.updateCollection();
	};
}

export default SubmissionsProcessor;