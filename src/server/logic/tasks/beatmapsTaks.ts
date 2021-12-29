import {retrieveCloudStorageFileAsString, uploadFileToCloudStorage, writeFileAsync} from '../fileManager';
import {Ranked, retrieveBeatmaps, updateBeatmap, deleteBeatmap} from '../../models/beatmap';
import {deleteApprovedSubmission} from '../../models/submission';
import OsuService from '../../../osuApi/osuApiService';
import {processBeatmap} from './baseTasks';
import PQueue from 'p-queue';

/**
 * Process all the ranked beatmaps released since the last time the function was executed until the last day of the past month in UTC time.
 *
 * @param osuService - The osu! API service to make request to the osu! API.
 * @param promiseQueue - The queue that limits the amount of promises per second.
 */
const processRankedBeatmaps = async (osuService: OsuService, promiseQueue: PQueue) => {
	console.info('Process ranked beatmaps start');
	const verificationDate = new Date();
	await osuService.retrieveToken();
	const state = JSON.parse((await retrieveCloudStorageFileAsString('state.json'))!);
	let [beatmaps, lastDate, lastBeatmapset, beatmapsLeft] = await osuService.retrieveRankedBeatmaps(state.lastDate, state.lastBeatmapset);
	console.log([beatmaps, lastDate, lastBeatmapset, beatmapsLeft]);
	while (beatmapsLeft || beatmaps.length > 0) {
		beatmaps.forEach(beatmap => promiseQueue.add(async () => await processBeatmap(beatmap, verificationDate)).catch(error => console.error(error)));
		await promiseQueue.onIdle();
		await uploadFileToCloudStorage(JSON.stringify({lastDate, lastBeatmapset}), 'state.json');
		[beatmaps, lastDate, lastBeatmapset, beatmapsLeft] = await osuService.retrieveRankedBeatmaps(lastDate, lastBeatmapset);
	}
	console.info('Process ranked beatmaps end');
};

/**
 * Updates all the beatmaps with their current favorites from the osu! API.
 *
 * @param osuService - The osu! API service to make request to the osu! API.
 * @param promiseQueue - The queue that limits the amount of promises per second.
 */
const updateFavorites = async (osuService: OsuService, promiseQueue: PQueue) => {
	console.info('Update favorites start');
	await osuService.retrieveToken();
	const beatmaps = await retrieveBeatmaps(['id']);
	beatmaps.forEach(beatmap => promiseQueue.add(async () => {
		const retrievedBeatmap = await osuService.retrieveBeatmap(beatmap.id!);
		if (retrievedBeatmap !== undefined) await updateBeatmap({id: retrievedBeatmap.id, favourite_count: retrievedBeatmap.favourite_count});
	}).catch(error => console.error(error)));
	await promiseQueue.onIdle();
	console.info('Update favorites end');
};

/**
 * Reprocess all the beatmaps to update all the values from an updates in the stream detection system or difficulty system.
 *
 * @param osuService - The osu! API service to make request to the osu! API.
 * @param promiseQueue - The queue that limits the amount of promises per second.
 */
const updateAllStatistics = async (osuService: OsuService, promiseQueue: PQueue) => {
	console.info('Update all statistics start');
	const verificationDate = new Date();
	await osuService.retrieveToken();
	await uploadFileToCloudStorage(JSON.stringify({lastDate: 0, lastBeatmapset: 0}), 'state.json');
	await processRankedBeatmaps(osuService, promiseQueue);
	const beatmaps = await retrieveBeatmaps(['id', 'ranked', 'last_verified']);
	beatmaps.forEach(beatmap => promiseQueue.add(async () => {
		if (beatmap.ranked === Ranked.ranked) {
			if (beatmap.last_verified! < verificationDate) await deleteBeatmap(beatmap.id!);
			return;
		}
		await writeFileAsync(`beatmaps/${beatmap.id!}.osu`, (await retrieveCloudStorageFileAsString(`beatmaps/${beatmap.id!}.osu`))!);
		const retrievedBeatmap = await osuService.retrieveBeatmap(beatmap.id!);
		if (retrievedBeatmap !== undefined && !(await processBeatmap(retrievedBeatmap, verificationDate))) await deleteApprovedSubmission(beatmap.id!);
	}).catch(error => console.error(error)));
	await promiseQueue.onIdle();
	console.info('Update all statistics end');
};

export {processRankedBeatmaps, updateFavorites, updateAllStatistics};
