import { NextFunction, Request, Response } from 'express';
import Beatmap from '../../models/beatmap';
import FileManager from '../fileManager';
import Filter from '../../models/filter';
import Sort from '../../models/sort';

const retrieveCollectionFile = async (request: Request, response: Response, next: NextFunction) => {
	try {
		FileManager.getFileStream(`collection.db`).pipe(response.status(200).attachment('collection.db'));
	} catch (error) {
		next(error);
	}
};

const retrieveFilteredBeatmapsByPage = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const { page, filters, sort }: { page: number; filters: Filter[]; sort: Sort } = request.body;
		let rawFilters: string[] | undefined;
		if (!request.body.is_admin) rawFilters = ['active_status = true'];
		const [rows, count] = await Beatmap.retrieveBeatmapsPagination(page, sort, filters, rawFilters);
		response.status(200).json({
			rows,
			count: Math.ceil(count / 12) || 1
		});
	} catch (error) {
		next(error);
	}
};

const updateBeatmapStatus = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const id = Number(request.params.id);
		const beatmapsUpdated = await Beatmap.updateBeatmap(
			{ id, active_status: request.body.active_status },
			{
				id,
				active_status: request.body.active_status
			}
		);
		if (beatmapsUpdated === 0) return response.status(404).send('Beatmap not found');
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

export { retrieveCollectionFile, retrieveFilteredBeatmapsByPage, updateBeatmapStatus };
