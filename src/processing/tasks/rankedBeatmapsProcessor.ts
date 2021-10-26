import BaseTask from './baseTask';

class RankedBeatmapsProcessor extends BaseTask {
	public processRankedBeatmaps = async () => {
		console.log('Process ranked beatmaps start');
		await this.apiService.retrieveToken();
		await this.osuService.retrieveToken();
		const state = await this.apiService.retrieveState();
		let [beatmaps, lastDate, lastBeatmapset, beatmapsLeft] = await this.osuService.retrieveRankedBeatmaps(state!.lastDate, state!.lastBeatmapset);
		while (beatmapsLeft || beatmaps.length > 0) {
			for (let index = 0, length = beatmaps.length; index < length; index++)
				this.promiseQueue.add(async () => {
					try {
						await this.processBeatmap(beatmaps[index]);
					} catch (error) {
						console.log(error);
					}
				});
			await this.promiseQueue.onIdle();
			await this.apiService.updateState({lastDate, lastBeatmapset});
			[beatmaps, lastDate, lastBeatmapset, beatmapsLeft] = await this.osuService.retrieveRankedBeatmaps(lastDate, lastBeatmapset);
		}
		await this.apiService.updateCollection();
		console.log('Process ranked beatmaps end');
	};
}

export default RankedBeatmapsProcessor;