import Submission from '../../models/submission';
import Beatmap from '../../models/beatmap';

const createBeatmap = async (beatmap: Beatmap, doubleTimeBeatmap: Beatmap, isSubmission: boolean = false): Promise<void> => {
	if (await Beatmap.updateBeatmap(beatmap, doubleTimeBeatmap) === 0) await Beatmap.createBeatmap(beatmap, doubleTimeBeatmap, isSubmission);
};

const retrieveBeatmaps = async (): Promise<Beatmap[]> => await Beatmap.retrieveBeatmaps(['id']);

const retrieveBeatmapsFromSubmissions = async (): Promise<Beatmap[]> =>
	await Beatmap.retrieveBeatmaps(['id', 'last_updated'], [], [`ranked_status != 'ranked'`]);

const retrievePendingSubmissions = async (): Promise<Submission[]> =>
	await Submission.retrieveSubmissions(['id'], [], [`approved_status = 'pending_approved'`]);

export {
	createBeatmap,
	retrieveBeatmaps,
	retrieveBeatmapsFromSubmissions,
	retrievePendingSubmissions
};