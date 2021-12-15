import Filter, { generateSelectConditionQuery, generateUpdateQuery } from './filter';
import OsuBeatmapset from '../../osuApi/models/beatmapset';
import OsuBeatmap from '../../osuApi/models/beatmap';
import Sort, { generateOrderQuery } from './sort';
import { ITask, txMode } from 'pg-promise';
import Database from './database';

/**
 * Interface that represents the beatmaps archived in the collection.
 */
interface Beatmap {
	/**
	 * The beatmap's ID.
	 */
	id?: number;

	/**
	 * The beatmap's set's ID.
	 */
	set_id?: number;

	/**
	 * The beatmap's number of favorites.
	 */
	favorites?: number;

	/**
	 * The beatmap's suggested beats per minute.
	 */
	bpm?: number;

	/**
	 * The beatmap's drain time measured in seconds.
	 */
	length?: number;

	/**
	 * The beatmap's weighted average streams length.
	 */
	average?: number;

	/**
	 * The beatmap's approach rate.
	 */
	ar?: number;

	/**
	 * The beatmap's overall difficulty.
	 */
	od?: number;

	/**
	 * The beatmap's circle size.
	 */
	cs?: number;

	/**
	 * The beatmap's difficulty.
	 */
	stars?: number;

	/**
	 * The beatmap's stream to hit object ratio.
	 */
	density?: number;

	/**
	 * The beatmap's active status for interactions.
	 */
	active_status?: boolean;

	/**
	 * The beatmap's name composed by the song's name and the beatmap version.
	 */
	name?: string;

	/**
	 * The beatmap's hash identifier.
	 */
	hash?: string;

	/**
	 * The beatmap's ranked status ('ranked', 'loved' and 'ranked').
	 */
	ranked_status?: string;

	/**
	 * The beatmap's date when it was last requested.
	 */
	last_requested?: Date;

	/**
	 * The beatmap's date when it was last updated.
	 */
	last_updated?: Date;
}

/**
 * The only string or boolean properties that are allowed as filters for retrieving beatmaps.
 */
const stringFilters: string[] = ['name', 'ranked_status', 'active_status'];

/**
 * The only numeric properties that are allowed as filters for retrieving beatmaps.
 */
const numericFilters: string[] = ['bpm', 'length', 'average', 'ar', 'od', 'cs', 'stars', 'density', 'last_updated'];

/**
 * Creates an instance of a beatmap based on an osu! api response.
 *
 * @param osuBeatmap - The osu! API beatmap corresponding to the beatmap.
 * @param osuBeatmapset - The osu! API beatmapset corresponding to the beatmap.
 * @returns A beatmap object based on the osu! api response.
 */
const createBeatmapFromOsuApi = (osuBeatmap: OsuBeatmap, osuBeatmapset: OsuBeatmapset): Beatmap => {
	return {
		id: osuBeatmap.id,
		set_id: osuBeatmapset.id,
		name: `${osuBeatmapset.title} [${osuBeatmap.version}]`,
		ar: osuBeatmap.ar,
		od: osuBeatmap.od,
		cs: osuBeatmap.cs,
		density: 0,
		length: osuBeatmap.length,
		bpm: osuBeatmap.bpm,
		stars: osuBeatmap.stars,
		ranked_status: osuBeatmap.ranked === 1 || osuBeatmap.ranked === 2 ? 'ranked' : osuBeatmap.ranked === 4 ? 'loved' : 'unranked',
		average: 0,
		hash: osuBeatmap.hash,
		favorites: osuBeatmapset.favourites,
		last_updated: osuBeatmapset.rankedDate !== undefined ? osuBeatmapset.rankedDate : osuBeatmap.lastUpdated
	} as Beatmap;
};

/**
 * Creates an instance of a beatmap based on an osu! api response.
 *
 * @param bpm - The beats per minute of the base beatmap.
 * @param doubleTimeStatistics - The statistics after being modified by the double time modification.
 * @returns A beatmap object based on the specific statistics modified by the double time modification.
 */
const createDoubleTimeBeatmap = (bpm: number, length: number, doubleTimeStatistics: { ar: number; od: number; stars: number }): Beatmap => {
	return {
		ar: Number(doubleTimeStatistics.ar.toFixed(1)),
		od: Number(doubleTimeStatistics.od.toFixed(1)),
		length: Math.round((length * 2) / 3),
		bpm: Math.round(bpm * 1.5),
		stars: Number(doubleTimeStatistics.stars.toFixed(2))
	} as Beatmap;
};

/**
 * Creates a beatmap in the database based on a beatmap instance with its double time statistics and updates the corresponding submission if provided.
 *
 * @param beatmap - The beatmap instance with all the values expected by the database.
 * @param doubleTimeBeatmap - The partial beatmap instance with only the properties that are affected by the double time modification.
 * @param isSubmission - The indicator for a beatmap that comes from a submission.
 */
const createBeatmap = async (beatmap: Beatmap, doubleTimeBeatmap: Beatmap, isSubmission: boolean = false): Promise<void> =>
	Database.tx(
		{ mode: new txMode.TransactionMode({ tiLevel: txMode.isolationLevel.readCommitted, readOnly: false }) },
		async (transaction: ITask<any>) => {
			let { id, average, cs, density, ranked_status, name, last_updated, set_id, favorites, bpm, length, ar, od, stars, hash } = beatmap;
			await transaction.none(
				`INSERT INTO table_beatmaps (id, set_id, favorites, bpm, length, average, ar, od, cs, stars, density, name, hash, ranked_status, last_updated)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
				[id, set_id, favorites, bpm, length, average, ar, od, cs, stars, density, name, hash, ranked_status, last_updated]
			);
			({ bpm, length, ar, od, stars } = doubleTimeBeatmap);
			await transaction.none(
				`INSERT INTO table_double_time_beatmaps (id, bpm, length, average, ar, od, cs, stars, density, name, ranked_status, last_updated)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
				[id, bpm, length, average, ar, od, cs, stars, density, name, ranked_status, last_updated]
			);
			if (isSubmission) await transaction.none(`UPDATE table_submissions SET approved_status = 'approved' WHERE id = $1`, [id]);
		}
	);

/**
 * Retrieves a beatmap from the database composed by the provided properties that matches the provided ID.
 *
 * @param id - The ID of the beatmap requested.
 * @param properties - The properties that are expected to be part of the returned beatmap.
 * @returns A promise of the requested beatmap or undefined if not found.
 */
const retrieveBeatmap = async (id: number, properties: string[] = ['id']): Promise<Beatmap | undefined> => {
	const beatmap = await Database.oneOrNone<Beatmap>(`SELECT ${properties.join(', ')} FROM table_beatmaps WHERE id = $1 LIMIT 1`, [id]);
	return beatmap !== null ? beatmap : undefined;
};

/**
 * Retrieves a beatmap from the database composed by the provided properties, filtered by dynamic and raw filters.
 *
 * @param isDoubleTime - The specification to whether or not to retrieve the beatmap with the double time statistics or the no modification statistics.
 * @param filters - The dynamic filters with a variable property, value and conditional operator.
 * @returns A promise of the least recently requested beatmap that match the filters or undefined if not found.
 */
const retrieveBeatmapRequest = async (isDoubleTime: boolean = false, filters: Filter[]): Promise<Beatmap | undefined> => {
	const [conditionQuery, values] = generateSelectConditionQuery(filters, numericFilters, stringFilters, ['active_status = true']);
	const tableName: string = isDoubleTime ? 'table_double_time_beatmaps' : 'table_beatmaps';
	const beatmap = await Database.oneOrNone<Beatmap>(
		`UPDATE ${tableName} SET last_requested = now() WHERE id = (SELECT id FROM ${tableName} ${conditionQuery} ORDER BY last_requested ASC LIMIT 1) 
			RETURNING id, bpm, length, average, ar, od, od, cs, stars, density, name, ranked_status`,
		values
	);
	return beatmap !== null ? beatmap : undefined;
};

/**
 * Retrieves an array of all the beatmaps from the database composed by the provided properties, filtered by dynamic and raw filters.
 *
 * @param properties - The properties that are expected to be part of the returned beatmaps.
 * @param filters - The dynamic filters with a variable property, value and conditional operator.
 * @param rawFilters - The raw filters that are directly provided in the query.
 * @returns A promise of an array of all the beatmaps that match the filters.
 */
const retrieveBeatmaps = async (properties: string[] = ['id'], filters: Filter[] = [], rawFilters: string[] = []): Promise<Beatmap[]> => {
	const [conditionQuery, values] = generateSelectConditionQuery(filters, numericFilters, stringFilters, rawFilters);
	return Database.manyOrNone<Beatmap>(`SELECT ${properties.join(', ')} FROM table_beatmaps ${conditionQuery}`, values);
};

/**
 * Retrieves an array of beatmaps from the database composed by the provided properties, filtered by dynamic and raw filters,
 * with a page that indicates the offset to apply and sorted by a specific order.
 *
 * @param page - The page which is then multiplied by 12, the result of this operation indicates the offset.
 * @param sort - The dynamic with a variable property and order.
 * @param filters - The dynamic filters with a variable property, value and conditional operator.
 * @param rawFilters - The raw filters that are directly provided in the query.
 * @returns A promise of an array with the beatmaps that match the filters and the page offset in the provided order in the first position and
 * the total amount of beatmaps that match the filters in the second position.
 */
const retrieveBeatmapsByPage = async (
	page: number,
	sort: Sort,
	filters: Filter[] = [],
	rawFilters: string[] = []
): Promise<[rows: Beatmap[], count: number]> => {
	const [conditionQuery, values] = generateSelectConditionQuery(filters, numericFilters, stringFilters, rawFilters);
	values.push((page - 1) * 12);
	return Database.tx<[rows: Beatmap[], count: number]>(
		{ mode: new txMode.TransactionMode({ tiLevel: txMode.isolationLevel.readCommitted, readOnly: true }) },
		async (transaction: ITask<any>) => {
			const rows = await transaction.manyOrNone<Beatmap>(
				`SELECT id, set_id, favorites, bpm, average, stars, active_status, name, ranked_status FROM table_beatmaps ${conditionQuery} 
				${generateOrderQuery(sort.sortProperty, sort.order, ['bpm', 'favorites', 'stars', 'last_updated'])} LIMIT 12 OFFSET $${values.length}`,
				values
			);
			const count = await transaction.result(`SELECT COUNT(id) FROM table_beatmaps ${conditionQuery}`, values);
			return [rows, count.rowCount];
		}
	);
};

/**
 * Updates the properties present in the beatmap and its double time statistics in the database.
 *
 * @param beatmap - The beatmap's properties that will be updated except for the ID, which is required but not updated.
 * @param doubleTimeBeatmap - The double time statistics properties that will be updated.
 * @returns A promise of whether or not the beatmap statistics or double time statistics were updated.
 */
const updateBeatmap = async (beatmap: Beatmap, doubleTimeBeatmap: Beatmap = {}): Promise<boolean> =>
	Database.tx(
		{ mode: new txMode.TransactionMode({ tiLevel: txMode.isolationLevel.readCommitted, readOnly: false }) },
		async (transaction: ITask<any>) => {
			let updatedRows = 0;
			let [query, values] = generateUpdateQuery('table_beatmaps', beatmap);
			if (query) updatedRows += (await transaction.result(query, values)).rowCount;
			[query, values] = generateUpdateQuery('table_double_time_beatmaps', { ...doubleTimeBeatmap, id: beatmap.id });
			if (query) updatedRows += (await transaction.result(query, values)).rowCount;
			return updatedRows > 0;
		}
	);

/**
 * Deletes a beatmap and its double time statistics from the database with a provided ID.
 *
 * @param id - The ID of the beatmap that will be removed.
 * @returns A promise of whether or not the beatmap was deleted.
 */
const deleteBeatmap = async (id: number): Promise<boolean> => (await Database.result(`DELETE FROM table_beatmaps WHERE id = $1`, [id])).rowCount > 0;

export default Beatmap;
export {
	createBeatmapFromOsuApi,
	createDoubleTimeBeatmap,
	createBeatmap,
	retrieveBeatmap,
	retrieveBeatmapRequest,
	retrieveBeatmaps,
	retrieveBeatmapsByPage,
	updateBeatmap,
	deleteBeatmap
};
