import {retrieveBeatmaps, createBeatmap} from '../beatmaps.logic';
import BaseTask from './baseTask';

class BeatmapsStatisticsUpdater extends BaseTask {
	public updateFavorites = async () => {
		console.log('Update favorites start');
		await this.osuService.retrieveToken();
		const beatmaps = await retrieveBeatmaps();
		this.promiseQueue.addAll(beatmaps.map(beatmap =>
			async () => {
				try {
					const retrievedBeatmap = await this.osuService.retrieveBeatmap(beatmap.id!);
					if (retrievedBeatmap !== undefined) await createBeatmap({
						id: retrievedBeatmap.id,
						favorites: retrievedBeatmap.favorites
					}, {});
				} catch (error) {
					console.log(error);
				}
			}
		)).catch(error => console.log(error));
		await this.promiseQueue.onIdle();
		console.log('Update favorites end');
	};
}

export default BeatmapsStatisticsUpdater;