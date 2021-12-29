import Beatmap, {retrieveBeatmaps, retrieveBeatmapsByPage, updateBeatmap} from '../../models/beatmap';
import {NextFunction, Request, Response} from 'express';
import Filter, {Operator} from '../../models/filter';
import {generate_collection} from 'ost-wasm-utils';
import Sort from '../../models/sort';
import {Buffer} from 'buffer';

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
		const {page, filters, sort}: { page: number; filters: Filter<Beatmap>[]; sort: Sort<Beatmap> } = request.body;
		if (!request.body.isAdmin) filters.push(new Filter('active', Operator.exact, true));
		const [rows, count] = await retrieveBeatmapsByPage(page, sort, filters);
		response.status(200).json({rows, count: Math.ceil(count / 12) || 1});
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
		const {active}: { active: boolean } = request.body;
		const id = Number(request.params.id);
		if (!(await updateBeatmap({id, active}, {id, active}))) return response.status(404).send('Beatmap not found');
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

/**
 * Generates and retrieves a custom .db/.osdb file based on the provided filters and the divisor provided.
 *
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const generateCollectionFileWeb = async (request: Request, response: Response, next: NextFunction): Promise<any> => {
	try{
		const {filters, useBpmDivisor, generateOsdb}: { filters: Filter<Beatmap>[], useBpmDivisor: boolean, generateOsdb: boolean } = request.body;
		const properties: (keyof Beatmap)[] = ['checksum', useBpmDivisor ? 'bpm' : 'stream_length'];
		const osdbAdditionalProperties: (keyof Beatmap)[] = ['id', 'beatmapset_id', 'checksum', 'difficulty_rating'];
		const beatmaps = await retrieveBeatmaps(generateOsdb ? properties.concat(osdbAdditionalProperties) : properties, filters);
		response.status(200).send(Buffer.from(generate_collection(beatmaps, useBpmDivisor, generateOsdb)));
	}
	catch (error) {
		next(error);
	}
};

export {generateCollectionFileWeb, retrieveBeatmapsByPageWeb, updateBeatmapStatusWeb};
