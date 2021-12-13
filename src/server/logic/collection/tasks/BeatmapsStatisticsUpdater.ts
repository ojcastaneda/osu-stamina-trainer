import { retrieveSubmissionFile } from '../submissions.logic';
import Beatmap from '../../../models/beatmap';
import BaseTask from './baseTask';
import { promisify } from 'util';
import { writeFile } from 'fs';

const writeFileAsync = promisify(writeFile);

class BeatmapsStatisticsUpdater extends BaseTask {
	public updateFavorites = async () => {
		console.info('Update favorites start');
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
						console.warn(error);
					}
				})
			)
			.catch(error => console.warn(error));
		await this.promiseQueue.onIdle();
		console.info('Update favorites end');
	};

	public updateAllStatistics = async () => {
		console.info('Update all statistics start');
		await this.osuService.retrieveToken();
		const beatmaps = await Beatmap.retrieveBeatmaps(['id', 'ranked_status']);
		this.promiseQueue
			.addAll(
				beatmaps.map(beatmap => async () => {
					try {
						const retrievedBeatmap = await this.osuService.retrieveBeatmap(beatmap.id!);
						if (retrievedBeatmap !== undefined) {
							/**
							if (beatmap.ranked_status !== 'ranked')
								await writeFileAsync(`beatmaps/${beatmap.id!}.osu`, (await retrieveSubmissionFile(beatmap.id!))!);*/
							await this.processBeatmap(retrievedBeatmap);
						}
					} catch (error) {
						console.warn(error);
					}
				})
			)
			.catch(error => console.warn(error));
		console.info('Update all statistics end');
	};
}

export default BeatmapsStatisticsUpdater;
