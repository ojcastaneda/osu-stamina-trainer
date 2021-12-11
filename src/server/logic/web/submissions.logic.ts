import { NextFunction, Request, Response } from 'express';
import Submission from '../../models/submission';
import Beatmap from '../../models/beatmap';
import Filter from '../../models/filter';
import fileManager from '../fileManager';
import Sort from '../../models/sort';

const createSubmission = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const { id }: { id: number } = request.body;
		if ((await Beatmap.retrieveBeatmap(id, ['id'])) !== undefined) return response.status(409).send('Beatmap already in the collection');
		const submission = await Submission.retrieveSubmission(id, ['id', 'approved_status']);
		if (submission !== undefined) {
			if (submission.approved_status !== 'pending') return response.status(409).send('Beatmap already in the collection');
			await Submission.updateSubmission({ id: submission.id, last_updated: new Date() });
		} else await Submission.createSubmission({ id });
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

const approveSubmission = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const id = Number(request.params.id);
		const lastUpdated = new Date();
		const submissionsUpdated = await Submission.updateSubmission({
			id,
			approved_status: 'pending_approved',
			last_updated: lastUpdated
		});
		if (submissionsUpdated === 0) return response.status(404).send('Submission not found');
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

const retrieveFilteredSubmissionsByPage = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const { page, filters, sort }: { page: number; filters: Filter[]; sort: Sort } = request.body;
		const [rows, count] = await Submission.retrieveSubmissionsPagination(page, sort, filters);
		response.status(200).json({ rows, count: Math.ceil(count / 10) || 1 });
	} catch (error) {
		next(error);
	}
};

const deleteSubmission = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const id = Number(request.params.id);
		const submissionsDeleted = await Submission.deleteSubmission(id);
		if (submissionsDeleted === 0) return response.status(404).send('Submission not found');
		const beatmap = await Beatmap.retrieveBeatmap(id, ['id', 'ranked_status']);
		if (beatmap !== undefined && beatmap.ranked_status !== 'ranked') await Beatmap.deleteBeatmap(id);
		if (await fileManager.deleteFile(`beatmaps/${id}.osu`)) return response.status(204).send();
		response.status(500).send('Internal server error');
	} catch (error) {
		next(error);
	}
};

export { createSubmission, approveSubmission, retrieveFilteredSubmissionsByPage, deleteSubmission };
