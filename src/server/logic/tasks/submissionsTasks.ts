import Submission, {Approved, createSubmission, deleteApprovedSubmission, deleteSubmission, retrieveSubmissions} from '../../models/submission';
import {deleteCloudStorageFile, uploadFileToCloudStorage, writeFileAsync} from '../fileManager';
import Beatmap, {Ranked, retrieveBeatmaps} from '../../models/beatmap';
import OsuService from '../../../osuApi/osuApiService';
import Filter, {Operator} from '../../models/filter';
import {processBeatmap} from './baseTasks';
import {existsSync, mkdirSync} from 'fs';
import fetch from 'cross-fetch';
import PQueue from 'p-queue';

/**
 * Process all the waiting_processing submissions to add them in the database if they satisfy the stream statistics requirements.
 *
 * @param osuService - The osu! API service to make request to the osu! API.
 * @param promiseQueue - The queue that limits the amount of promises per second.
 */
const approveSubmissions = async (osuService: OsuService, promiseQueue: PQueue) => {
	console.info('Approve submissions start');
	if (!existsSync('beatmaps')) mkdirSync('beatmaps');
	await osuService.retrieveToken();
	const submissions = await retrieveSubmissions(['id'], [new Filter<Submission>('approved', Operator.exact, Approved.waiting_processing)]);
	const submissionsToProcess: boolean[] = [];
	const osuDownloadQueue = new PQueue({interval: 5000, intervalCap: 1, concurrency: 1});
	submissions.forEach((submission, index) => {
		osuDownloadQueue.add(async () => {
			const downloadResult = await downloadSubmissionFile(submission.id!);
			submissionsToProcess[index] = downloadResult === 'process';
			if (downloadResult === 'delete') await deleteSubmission(submission.id!);
		}).catch(error => console.error(error));
	});
	await osuDownloadQueue.onIdle();
	const verificationDate = new Date();
	submissions.forEach((submission, index) => promiseQueue.add(async () => {
		if (!submissionsToProcess[index]) return;
		const beatmap = await osuService.retrieveBeatmap(submission.id!);
		if (beatmap === undefined) return;
		if (await processBeatmap(beatmap, verificationDate, beatmap.ranked !== Ranked.ranked)) {
			if (beatmap.ranked === Ranked.ranked) {
				await deleteSubmission(submission.id!);
				await deleteCloudStorageFile(`beatmaps/${submission.id!}.osu`);
			}
		} else {
			await deleteApprovedSubmission(submission.id!);
		}
	}).catch(error => console.error(error)));
	await promiseQueue.onIdle();
	console.info('Approve submissions end');
};

/**
 * Checks the last updated date of all the approved submissions in the database, removing the deleted beatmaps and resubmitting them if there were
 * any changes.
 *
 * @param osuService - The osu! API service to make request to the osu! API.
 * @param promiseQueue - The queue that limits the amount of promises per second.
 */
const checkSubmissionsLastUpdate = async (osuService: OsuService, promiseQueue: PQueue) => {
	console.info('Submissions update start');
	await osuService.retrieveToken();
	const beatmaps = await retrieveBeatmaps(['id', 'last_updated'], [new Filter<Beatmap>('ranked', Operator.different, Ranked.ranked)]);
	beatmaps.forEach(beatmap => {
		promiseQueue.add(async () => {
			const retrievedBeatmap = await osuService.retrieveBeatmap(beatmap.id!);
			if (retrievedBeatmap === undefined) {
				await deleteApprovedSubmission(beatmap.id!);
			} else if (retrievedBeatmap.last_updated! > beatmap.last_updated!) {
				await deleteApprovedSubmission(beatmap.id!);
				await createSubmission({id: beatmap.id!});
			}
		}).catch(error => console.error(error));
	});
	await promiseQueue.onIdle();
	console.info('Submissions update end');
};

/**
 * Downloads the contents of a betamap's .osu file if it exists to later upload them in the cloud storage and the local machine.
 *
 * @param id - The id of the beatmap.
 * @returns A promise of whether the process was successful, the beatmap was deleted or it must be postponed due to technical issues.
 */
const downloadSubmissionFile = async (id: number): Promise<string> => {
	const response = await fetch(`https://osu.ppy.sh/osu/${id}`);
	if (!response.ok) return 'postponed';
	const file = await response.text();
	if (!file) return 'delete';
	await writeFileAsync(`beatmaps/${id!}.osu`, file);
	await uploadFileToCloudStorage(file, `beatmaps/${id}.osu`);
	return 'process';
};

export {approveSubmissions, checkSubmissionsLastUpdate};
