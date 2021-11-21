import Submission from '../../models/submission';
import Beatmap from '../../models/beatmap';
import fileManager from '../fileManager';

const retrieveSubmissionFile = async (id: number): Promise<string | undefined> => {
	const submission = await Submission.retrieveSubmission(id, ['id']);
	if (submission !== undefined) return fileManager.getFileAsString(`beatmaps/${id}.osu`);
};

const createSubmission = async (id: number): Promise<void> => {
	const submission = await Submission.retrieveSubmission(id, ['id', 'approved_status']);
	if (submission === undefined) await Submission.createSubmission({id});
	else if (submission.approved_status === 'pending') await Submission.updateSubmission({
		id: submission.id,
		last_updated: new Date()
	});
};

const rankSubmission = async (id: number): Promise<void> => {
	const beatmap = await Beatmap.retrieveBeatmap(id, ['id']);
	if (beatmap) {
		const result = await Submission.deleteSubmission(id);
		if (result !== 0) await fileManager.deleteFile(`beatmaps/${id}.osu`);
	}
};

const deleteSubmission = async (id: number): Promise<void> => {
	const submissionsDeleted = await Submission.deleteSubmission(id);
	if (submissionsDeleted === 0) return;
	await Beatmap.deleteBeatmap(id);
	await fileManager.deleteFile(`beatmaps/${id}.osu`);
};

export {
	retrieveSubmissionFile,
	createSubmission,
	rankSubmission,
	deleteSubmission
};