import { createSubmission, deleteApprovedSubmission, retrieveSubmission, retrieveSubmissionsByPage, updateSubmission } from '../../models/submission';
import { NextFunction, Request, Response } from 'express';
import { retrieveBeatmap } from '../../models/beatmap';
import Filter from '../../models/filter';
import Sort from '../../models/sort';

/**
 * Creates a submission with the provided id in the database if the id is not already registered. 
 * Otherwise if the submission has not been approved, it updates the last updated date of the submission.
 * 
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const createSubmissionWeb = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const { id }: { id: number } = request.body;
		if ((await retrieveBeatmap(id)) !== undefined) return response.status(409).send('Beatmap already in the collection');
		const submission = await retrieveSubmission(id, ['id', 'approved_status']);
		if (submission === undefined) {
			await createSubmission({ id });
			return response.status(204).send();
		}
		if (submission.approved_status !== 'pending') return response.status(409).send('Beatmap already in the collection');
		await updateSubmission({ id: submission.id, last_updated: new Date() });
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

/**
 * Changes the approved status to pending_approved of an existing submission, 
 * this state will tell the batch jobs to process the beatmap associated to the submission's id.
 * 
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const approveSubmissionWeb = async (request: Request, response: Response, next: NextFunction) => {
	try {
		if (!(await updateSubmission({ id: Number(request.params.id), approved_status: 'pending_approved', last_updated: new Date() })))
			return response.status(404).send('Submission not found');
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

/**
 * Retrieves list of the 10 submissions corresponding to the page, filters and order provided. 
 * It also retrieves the total amount of pages derived from the provided filters.
 * 
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const retrieveSubmissionsByPageWeb = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const { page, filters, sort }: { page: number; filters: Filter[]; sort: Sort } = request.body;
		const [rows, count] = await retrieveSubmissionsByPage(page, sort, filters);
		response.status(200).json({ rows, count: Math.ceil(count / 10) || 1 });
	} catch (error) {
		next(error);
	}
};

/**
 * Deletes a submission from the database, the associated beatmap and the file stored in the cloud storage if available.
 * 
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const deleteSubmissionWeb = async (request: Request, response: Response, next: NextFunction) => {
	try {
		if (!(await deleteApprovedSubmission(Number(request.params.id)))) return response.status(404).send('Submission not found');
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

export { createSubmissionWeb, approveSubmissionWeb, retrieveSubmissionsByPageWeb, deleteSubmissionWeb };
