import BaseTask from './baseTask';

class BeatmapsStatisticsUpdater extends BaseTask {
	public updateFavorites = async () => {
		await this.apiService.retrieveToken();
		await this.osuService.retrieveToken();
		const beatmaps = await this.apiService.retrieveBeatmaps();
		for (let index = 0, length = beatmaps.length; index < length; index++) {
			this.promiseQueue.add(async () => {
				try {
					const beatmap = await this.osuService.retrieveBeatmap(beatmaps[index].id);
					if (beatmap !== undefined) await this.apiService.createBeatmap({
						id: beatmap.id,
						favorites: beatmap.favorites
					}, {});
				} catch (error) {
					console.log(error);
				}
			});
		}
		await this.promiseQueue.onIdle();
		const honoredBeatmaps = await this.apiService.retrieveHonoredBeatmaps();
		for (let index = 0, length = honoredBeatmaps.length; index < length; index++) {
			this.promiseQueue.add(async () => {
				try {
					const beatmap = await this.osuService.retrieveBeatmap(honoredBeatmaps[index].id);
					if (beatmap !== undefined) await this.apiService.createHonoredBeatmap({
						id: beatmap.id,
						favorites: beatmap.favorites
					});
				} catch (error) {
					console.log(error);
				}
			});
		}
		await this.promiseQueue.onIdle();
	};
}

export default BeatmapsStatisticsUpdater;