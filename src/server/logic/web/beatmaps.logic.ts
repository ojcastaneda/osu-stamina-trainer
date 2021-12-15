import { retrieveBeatmapsByPage, updateBeatmap } from '../../models/beatmap';
import { retrieveCloudStorageFileStream } from '../fileManager';
import { NextFunction, Request, Response } from 'express';
import Filter from '../../models/filter';
import Sort from '../../models/sort';

/**
 * Exposes the collection.db file as a read stream to be downloaded.
 * 
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const retrieveCollectionFileWeb = async (request: Request, response: Response, next: NextFunction) => {
	try {
		retrieveCloudStorageFileStream(`collection.db`).pipe(response.status(200).attachment('collection.db'));
	} catch (error) {
		next(error);
	}
};

/**
 * Retrieves list of the 12 beatmaps corresponding to the page, filters and order provided. 
 * It also retrieves the total amount of pages derived from the provided filters.
 * 
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const retrieveBeatmapsByPageWeb = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const { page, filters, sort }: { page: number; filters: Filter[]; sort: Sort } = request.body;
		let rawFilters: string[] | undefined;
		if (!request.body.is_admin) rawFilters = ['active_status = true'];
		const [rows, count] = await retrieveBeatmapsByPage(page, sort, filters, rawFilters);
		response.status(200).json({ rows, count: Math.ceil(count / 12) || 1 });
	} catch (error) {
		next(error);
	}
};

/**
 * Changes the active status of an existing beatmap, this state will include/exclude the beatmap from the public.
 * 
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const updateBeatmapStatusWeb = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const { active_status }: { active_status: boolean } = request.body;
		const id = Number(request.params.id);
		if (!(await updateBeatmap({ id, active_status }, { id, active_status }))) return response.status(404).send('Beatmap not found');
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

export { retrieveCollectionFileWeb, retrieveBeatmapsByPageWeb, updateBeatmapStatusWeb };
