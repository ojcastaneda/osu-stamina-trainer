import OsuBeatmapset from '../../osuApi/models/beatmapset';
import OsuBeatmap from '../../osuApi/models/beatmap';
import {ITask, txMode} from 'pg-promise';
import Database from './database';
import Filter from './filter';
import Sort from './sort';

/**
 * Class that represents the beatmaps archived in the collection
 */
class Beatmap {
	/**
	 * The only string or boolean properties that are allowed as filters for retrieving beatmaps
	 * @private
	 */
	private static stringFilters: string[] = ['name', 'ranked_status', 'active_status'];

	/**
	 * The only numeric properties that are allowed as filters for retrieving beatmaps
	 * @private
	 */
	private static numericFilters: string[] = ['bpm', 'length', 'average', 'ar', 'od', 'cs', 'stars', 'density', 'last_updated'];

	/**
	 * The beatmap's ID
	 */
	public id?: number;

	/**
	 * The beatmap's set's ID
	 */
	public set_id?: number;

	/**
	 * The beatmap's number of favorites from users
	 */
	public favorites?: number;

	/**
	 * The beatmap's highest beats per minute during streams
	 */
	public bpm?: number;

	/**
	 * The beatmap's drain time measured in seconds
	 */
	public length?: number;

	/**
	 * The beatmap's streams weighted average length
	 */
	public average?: number;

	/**
	 * The beatmap's approach rate
	 */
	public ar?: number;

	/**
	 * The beatmap's overall difficulty
	 */
	public od?: number;

	/**
	 * The beatmap's circle size
	 */
	public cs?: number;

	/**
	 * The beatmap's difficulty
	 */
	public stars?: number;

	/**
	 * The beatmap's stream to hit object ratio
	 */
	public density?: number;

	/**
	 * The beatmap's active status for interactions
	 */
	public active_status?: boolean;

	/**
	 * The beatmap's name composed by the song's name and the beatmap version
	 */
	public name?: string;

	/**
	 * The beatmap's hash identifier
	 */
	public hash?: string;

	/**
	 * The beatmap's ranked status ('ranked', 'loved' and 'ranked')
	 */
	public ranked_status?: string;

	/**
	 * The beatmap's date when the last request was registered
	 */
	public last_requested?: Date;

	/**
	 * The beatmap's date when the last modification was registered
	 */
	public last_updated?: Date;

	/**
		 Creates an empty instance of a beatmap
	 */
	private constructor() {
	}

	/**
	 * Creates an instance of a beatmap based on an osu! api response
	 * @param osuBeatmap The osu! API beatmap corresponding to the beatmap
	 * @param osuBeatmapset The osu! API beatmapset corresponding to the beatmap
	 */
	public static createBeatmapFromOsuApi(osuBeatmap: OsuBeatmap, osuBeatmapset: OsuBeatmapset): Beatmap {
		const beatmap = new Beatmap();
		beatmap.id = osuBeatmap.id;
		beatmap.set_id = osuBeatmapset.id;
		beatmap.name = `${osuBeatmapset.title} [${osuBeatmap.version}]`;
		beatmap.ar = osuBeatmap.ar;
		beatmap.od = osuBeatmap.od;
		beatmap.cs = osuBeatmap.cs;
		beatmap.density = 0;
		beatmap.length = osuBeatmap.length;
		beatmap.bpm = osuBeatmap.bpm;
		beatmap.stars = osuBeatmap.stars;
		if (osuBeatmap.ranked === 1 || osuBeatmap.ranked === 2)
			beatmap.ranked_status = 'ranked';
		else if (osuBeatmap.ranked === 4)
			beatmap.ranked_status = 'loved';
		else
			beatmap.ranked_status = 'unranked';
		beatmap.average = 0;
		beatmap.hash = osuBeatmap.hash;
		beatmap.favorites = osuBeatmapset.favourites;
		if (osuBeatmapset.rankedDate) beatmap.last_updated = osuBeatmapset.rankedDate;
		else beatmap.last_updated = osuBeatmap.lastUpdated;
		return beatmap;
	}

	/**
	 * Creates an instance of a beatmap based on an osu! api response
	 * @param bpm The beats per minute of the base beatmap
	 * @param doubleTimeStatistics The statistics after being modified by the double time modification
	 */
	public static createDoubleTimeBeatmap(bpm: number, length: number, doubleTimeStatistics: { ar: number, od: number, stars: number }): Beatmap {
		const beatmap = new Beatmap();
		beatmap.ar = Number(doubleTimeStatistics.ar.toFixed(1));
		beatmap.od = Number(doubleTimeStatistics.od.toFixed(1));
		beatmap.length = Math.round(length * 2 / 3);
		beatmap.bpm = Math.round(bpm * 1.5);
		beatmap.stars = Number(doubleTimeStatistics.stars.toFixed(2));
		return beatmap;
	}

	/**
	 * Creates a beatmap in the database based on a beatmap instance with its double time statistics and updates the corresponding submission if specified
	 *
	 * @param beatmap - The beatmap instance with all the values expected by the database
	 * @param doubleTimeBeatmap - The partial beatmap instance with only the properties that are affected by the double time modification
	 * @param isSubmission - The indicator for a beatmap that comes from a submission
	 * @returns An empty promise
	 */
	public static createBeatmap = async (beatmap: Beatmap, doubleTimeBeatmap: Beatmap, isSubmission: boolean = false): Promise<void> => {
		return await Database.client.tx({
			mode: new txMode.TransactionMode({
				tiLevel: txMode.isolationLevel.readCommitted,
				readOnly: false
			})
		}, async (transaction: ITask<any>) => {
			const {id, average, cs, density, ranked_status, name, last_updated} = beatmap;
			await (async () => {
				const {set_id, favorites, bpm, length, ar, od, stars, hash} = beatmap;
				await transaction.none(`INSERT INTO table_beatmaps (id, set_id, favorites, bpm, length, average, ar, od,
                                                                    cs, stars, density, name, hash, ranked_status,
                                                                    last_updated)
                                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
					[id, set_id, favorites, bpm, length, average, ar, od, cs, stars, density, name, hash, ranked_status, last_updated]);
			})();
			await (async () => {
				const {bpm, length, ar, od, stars} = doubleTimeBeatmap;
				await transaction.none('INSERT INTO table_double_time_beatmaps (id, bpm, length, average, ar, od, cs, stars, density, name, ranked_status, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
					[id, bpm, length, average, ar, od, cs, stars, density, name, ranked_status, last_updated]);
			})();
			if (isSubmission) await transaction.none(`UPDATE table_submissions
                                                      SET approved_status = 'approved'
                                                      WHERE id = $1`, [id]);
		});
	};

	/**
	 * Retrieves a beatmap from the database composed by the specified properties that matches the provided ID
	 *
	 * @param id - The ID of the beatmap requested
	 * @param properties - The properties that are expected to be part of the returned beatmap
	 * @returns A promise of the requested beatmap or undefined if not found
	 */
	public static retrieveBeatmap = async (id: number, properties: string[] = ['id']): Promise<Beatmap | undefined> => {
		const beatmap = await Database.client.oneOrNone<Beatmap>(`SELECT ${properties}
                                                                  FROM table_beatmaps
                                                                  WHERE id = $1
                                                                  LIMIT 1`, [id]);
		return beatmap !== null ? beatmap : undefined;
	};

	/**
	 * Retrieves an array of all the beatmaps from the database composed by the specified properties, filtered by dynamic and raw filters
	 *
	 * @param properties - The properties that are expected to be part of the returned beatmaps
	 * @param filters - The dynamic filters with a variable property, value and conditional operator
	 * @param rawFilters - The raw filters that are directly provided in the query
	 * @returns A promise of an array of all the beatmaps that match the filters
	 */
	public static retrieveBeatmaps = async (properties: string[] = ['id'], filters: Filter[] = [], rawFilters: string[] = []): Promise<Beatmap[]> => {
		const [conditionQuery, values] = Filter.generateSelectConditionQuery(filters, Beatmap.numericFilters,
			Beatmap.stringFilters, rawFilters);
		return await Database.client.manyOrNone<Beatmap>(`SELECT ${properties}
                                                          FROM table_beatmaps ${conditionQuery}`, values);

	};

	/**
	 * Updates the properties present in the beatmap and its double time statistics in the database
	 *
	 * @param beatmap - The beatmap's properties that will be updated except for the ID, which is required but not updated
	 * @param doubleTimeBeatmap - The double time statistics properties that will be updated
	 * @returns A promise of the number of updated beatmaps and double time statistics
	 */
	public static updateBeatmap = async (beatmap: Beatmap, doubleTimeBeatmap: Beatmap = {}): Promise<number> => {
		return await Database.client.tx({
			mode: new txMode.TransactionMode({
				tiLevel: txMode.isolationLevel.readCommitted,
				readOnly: false
			})
		}, async (transaction: ITask<any>) => {
			let updatedRows = 0;
			let [query, values] = Filter.generateUpdateQuery('table_beatmaps', beatmap);
			if (query) updatedRows += await transaction.result(query, values, result => result.rowCount);
			[query, values] = Filter.generateUpdateQuery('table_double_time_beatmaps', {...doubleTimeBeatmap, id: beatmap.id});
			if (query) updatedRows += await transaction.result(query, values, result => result.rowCount);
			return updatedRows;
		});
	};

	/**
	 * Deletes a beatmap and its double time statistics from the database with a specified ID
	 *
	 * @param id - The ID of the beatmap that will be removed
	 * @returns A promise of the number of deleted beatmaps
	 */
	public static deleteBeatmap = async (id: number): Promise<number> =>
		Database.client.result('DELETE FROM table_beatmaps WHERE id = $1', [id], result => result.rowCount);

	/**
	 * Retrieves a beatmap from the database composed by the specified properties, filtered by dynamic and raw filters
	 *
	 * @param isDoubleTime - The specification to whether or not to retrieve the beatmap with the double time statistics or the no modification statistics
	 * @param filters - The dynamic filters with a variable property, value and conditional operator
	 * @returns A promise of the least recently requested beatmap that match the filters or undefined if not found
	 */
	public static retrieveBeatmapRequest = async (isDoubleTime: boolean = false, filters: Filter[]): Promise<Beatmap | undefined> => {
		const [conditionQuery, values] = Filter.generateSelectConditionQuery(filters, Beatmap.numericFilters, Beatmap.stringFilters, ['active_status = true']);
		let tableName: string;
		isDoubleTime ? tableName = 'table_double_time_beatmaps' : tableName = 'table_beatmaps';
		const beatmap = await Database.client.oneOrNone<Beatmap>(`UPDATE ${tableName}
                                                                  SET last_requested = now()
                                                                  WHERE id =
                                                                        (SELECT id
                                                                         FROM ${tableName} ${conditionQuery}
                                                                         ORDER BY last_requested ASC
                                                                         LIMIT 1)
                                                                  RETURNING id, bpm, length, average, ar, od, od, cs, stars, density, name, ranked_status`, values);
		return beatmap !== null ? beatmap : undefined;
	};

	/**
	 * Retrieves an array of beatmaps from the database composed by the specified properties, filtered by dynamic and raw filters,
	 * with a page that indicates the offset to apply and sorted by a specific order
	 *
	 * @param page - The page which is then multiplied by 12, the result of this operation indicates the offset
	 * @param sort - The dynamic with a variable property and order
	 * @param filters - The dynamic filters with a variable property, value and conditional operator
	 * @param rawFilters - The raw filters that are directly provided in the query
	 * @returns A promise of an array with the beatmaps that match the filters and the page offset in the specified order in the first position and
	 * the total amount of beatmaps that match the filters in the second position
	 */
	public static retrieveBeatmapsPagination = async (page: number, sort: Sort, filters: Filter[] = [], rawFilters: string[] = []):
		Promise<[rows: Beatmap[], count: number]> => {
		const [conditionQuery, values] = Filter.generateSelectConditionQuery(filters, Beatmap.numericFilters, Beatmap.stringFilters, rawFilters);
		const {sortProperty, order} = sort;
		const sortQuery = Sort.generateOrderQuery(sortProperty, order, ['bpm', 'favorites', 'stars', 'last_updated']);
		values.push((page - 1) * 12);
		return await Database.client.tx<[rows: Beatmap[], count: number]>({
			mode: new txMode.TransactionMode({
				tiLevel: txMode.isolationLevel.readCommitted,
				readOnly: true
			})
		}, async (transaction: ITask<any>) => {
			const rows = await transaction.manyOrNone<Beatmap>(`SELECT id,
                                                                       set_id,
                                                                       favorites,
                                                                       bpm,
                                                                       average,
                                                                       stars,
                                                                       active_status,
                                                                       name,
                                                                       ranked_status
                                                                FROM table_beatmaps ${conditionQuery} ${sortQuery}
                                                                LIMIT 12 OFFSET $${values.length}`, values);
			const count = await transaction.one<number>(`SELECT COUNT(id)
                                                         FROM table_beatmaps ${conditionQuery}`, values, (data: { count: number }) => data.count);
			return [rows, count];
		});
	};

}

export default Beatmap;