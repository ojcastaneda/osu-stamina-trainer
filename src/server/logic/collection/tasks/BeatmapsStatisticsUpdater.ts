import Beatmap from '../../../models/beatmap';
import BaseTask from './baseTask';
import util from 'util';
import fs from 'fs';
import { retrieveSubmissionFile } from '../submissions.logic';

const writeFileAsync = util.promisify(fs.writeFile);

class BeatmapsStatisticsUpdater extends BaseTask {
	public updateFavorites = async () => {
		console.log('Update favorites start');
		await this.osuService.retrieveToken();
		const beatmaps = await Beatmap.retrieveBeatmaps(['id']);
		this.promiseQueue
			.addAll(
				beatmaps.map(beatmap => async () => {
					try {
						const retrievedBeatmap = await this.osuService.retrieveBeatmap(beatmap.id!);
						if (retrievedBeatmap !== undefined)
							await Beatmap.updateBeatmap({
								id: retrievedBeatmap.id,
								favorites: retrievedBeatmap.favorites
							});
					} catch (error) {
						console.log(error);
					}
				})
			)
			.catch(error => console.log(error));
		await this.promiseQueue.onIdle();
		console.log('Update favorites end');
	};

	public updateAllStatistics = async () => {
		console.log('Update all statistics start');
		await this.osuService.retrieveToken();
		const beatmaps = await Beatmap.retrieveBeatmaps(['id', 'ranked_status']);
		this.promiseQueue
			.addAll(
				beatmaps.map(beatmap => async () => {
					try {
						const retrievedBeatmap = await this.osuService.retrieveBeatmap(beatmap.id!);
						if (retrievedBeatmap !== undefined) {
							if (beatmap.ranked_status !== 'ranked')
								await writeFileAsync(`beatmaps/${beatmap.id!}.osu`, (await retrieveSubmissionFile(beatmap.id!))!);
							await this.processBeatmap(retrievedBeatmap);
						}
					} catch (error) {
						console.log(error);
					}
				})
			)
			.catch(error => console.log(error));
	};
}

export default BeatmapsStatisticsUpdater;
