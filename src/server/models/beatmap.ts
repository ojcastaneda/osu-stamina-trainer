import Filter, {generateSelectConditionQuery, generateUpdateQuery} from './filter';
import OsuBeatmapset from '../../osuApi/models/beatmapset';
import OsuBeatmap from '../../osuApi/models/beatmap';
import Sort, {generateOrderQuery} from './sort';
import {ITask, txMode} from 'pg-promise';
import Database, {Entity, Tables} from './database';

/**
 * Interface that represents the beatmaps archived in the collection.
 */
interface Beatmap extends Entity {

	/**
	 * The beatmap's set's ID.
	 */
	beatmapset_id?: number;

	/**
	 * The beatmap's number of favorites.
	 */
	favourite_count?: number;

	/**
	 * The beatmap's number of plays.
	 */
	play_count?: number;

	/**
	 * The beatmap's suggested beats per minute.
	 */
	bpm?: number;

	/**
	 * The beatmap's drain time measured in seconds.
	 */
	hit_length?: number;

	/**
	 * The beatmap's weighted average streams length.
	 */
	stream_length?: number;

	/**
	 * The beatmap's overall difficulty.
	 */
	accuracy?: number;

	/**
	 * The beatmap's approach rate.
	 */
	ar?: number;

	/**
	 * The beatmap's circle size.
	 */
	cs?: number;

	/**
	 * The beatmap's stream to hit object ratio.
	 */
	stream_density?: number;

	/**
	 * The beatmap's difficulty raiting.
	 */
	difficulty_rating?: number;

	/**
	 * The beatmap's active status.
	 */
	active?: boolean;

	/**
	 * The beatmap's song title.
	 */
	title?: string;

	/**
	 * The beatmap's md5 checksum.
	 */
	checksum?: string;

	/**
	 * The beatmap's ranked status.
	 */
	ranked?: Ranked;

	/**
	 * The beatmap's date when it was last verified by .
	 */
	last_verified?: Date;

	/**
	 * The beatmap's date when it was last requested by a user.
	 */
	last_requested?: Date;

	/**
	 * The beatmap's date when it was last updated.
	 */
	last_updated?: Date;
}

enum Ranked {
	ranked = 'ranked', loved = 'loved', unranked = 'unranked'
}

/**
 * The only properties that are allowed as filters for retrieving beatmaps.
 */
const allowedFilters: (keyof Beatmap)[] = ['bpm', 'hit_length', 'stream_length', 'accuracy', 'ar', 'cs', 'stream_density', 'difficulty_rating',
	'active', 'title', 'ranked', 'last_verified', 'last_updated'];

/**
 * Creates an instance of a beatmap based on an osu! api response.
 *
 * @param beatmap - The osu! API beatmap corresponding to the beatmap.
 * @param beatmapset - The osu! API beatmapset corresponding to the beatmap.
 * @returns A beatmap object based on the osu! api response.
 */
const createBeatmapFromOsuApi = (beatmap: OsuBeatmap, beatmapset: OsuBeatmapset): Beatmap => {
	const {id, beatmapset_id, hit_length, accuracy, ar, cs, difficulty_rating, version, checksum, ranked, last_updated} = beatmap;
	const {favourite_count, play_count, title, ranked_date} = beatmapset;
	return {
		id, beatmapset_id, favourite_count, play_count, hit_length, accuracy, ar, cs, difficulty_rating, title: `${title} [${version}]`, checksum,
		ranked: ranked === 1 || ranked === 2 ? Ranked.ranked : ranked === 4 ? Ranked.loved : Ranked.unranked,
		last_updated: ranked_date !== null ? ranked_date : last_updated
	} as Beatmap;
};

/**
 * Creates an instance of a beatmap based on an osu! api response.
 *
 * @param bpm - The beats per minute of the base beatmap.
 * @param doubleTimeStatistics - The statistics after being modified by the double time modification.
 * @returns A beatmap object based on the specific statistics modified by the double time modification.
 */
const createDoubleTimeBeatmap = (bpm: number, hit_length: number, accuracy: number, ar: number, difficulty_rating: number): Beatmap => {
	return {
		bpm: Math.round(bpm * 1.5), hit_length: Math.round((hit_length * 2) / 3), ar: Number(ar.toFixed(1)), accuracy: Number(accuracy.toFixed(1)),
		difficulty_rating: Number(difficulty_rating.toFixed(2))
	} as Beatmap;
};

/**
 * Creates a beatmap in the database based on a beatmap instance with its double time statistics and updates the corresponding submission if provided.
 *
 * @param beatmap - The beatmap instance with all the values expected by the database.
 * @param doubleTimeBeatmap - The partial beatmap instance with only the properties that are affected by the double time modification.
 * @param isSubmission - The indicator for a beatmap that comes from a submission.
 */
const createBeatmap = async (beatmap: Beatmap, doubleTimeBeatmap: Beatmap, isSubmission: boolean = false): Promise<void> => Database.tx(
	{mode: new txMode.TransactionMode({tiLevel: txMode.isolationLevel.readCommitted, readOnly: false})}, async (transaction: ITask<any>) => {
		let {
			id, beatmapset_id, favourite_count, play_count, bpm, hit_length, stream_length, accuracy, ar, cs, stream_density, difficulty_rating,
			title, checksum, ranked, last_verified, last_updated
		} = beatmap;
		await transaction.none(`INSERT INTO ${Tables.beatmaps} (id, beatmapset_id, favourite_count, play_count, bpm, hit_length, stream_length, 
			accuracy, ar, cs, stream_density, difficulty_rating, title, checksum, ranked, last_verified, last_updated) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
			[	id, beatmapset_id, favourite_count, play_count, bpm, hit_length, stream_length, accuracy, ar, cs, stream_density, difficulty_rating,
				title, checksum, ranked, last_verified, last_updated]);
		({bpm, hit_length, accuracy, ar, difficulty_rating} = doubleTimeBeatmap);
		await transaction.none(`INSERT INTO ${Tables.double_time_beatmaps} (id, bpm, hit_length, stream_length, accuracy, ar, cs, stream_density, 
		difficulty_rating, title, ranked, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			[id, bpm, hit_length, stream_length, accuracy, ar, cs, stream_density, difficulty_rating, title, ranked, last_updated]);
		if (isSubmission) await transaction.none(`UPDATE ${Tables.submissions} SET approved = 'approved' WHERE id = $1`, [id]);
	});

/**
 * Retrieves a beatmap from the database composed by the provided properties that matches the provided ID.
 *
 * @param id - The ID of the beatmap requested.
 * @param properties - The properties that are expected to be part of the returned beatmap.
 * @returns A promise of the requested beatmap or undefined if not found.
 */
const retrieveBeatmap = async (id: number, properties: (keyof Beatmap)[] | '*' = '*'): Promise<Beatmap | undefined> => {
	const formattedProperties = properties === '*' ? properties : properties.join(', ');
	const beatmap = await Database.oneOrNone<Beatmap>(`SELECT ${formattedProperties} FROM ${Tables.beatmaps} WHERE id = $1 LIMIT 1`, [id]);
	return beatmap !== null ? beatmap : undefined;
};

/**
 * Retrieves a beatmap from the database composed by the provided properties, filtered by dynamic and raw filters.
 *
 * @param isDoubleTime - The specification to whether or not to retrieve the beatmap with the double time statistics or the no modification
 *     statistics.
 * @param filters - The dynamic filters with a variable property, value and conditional operator.
 * @returns A promise of the least recently requested beatmap that match the filters or undefined if not found.
 */
const retrieveBeatmapRequest = async (isDoubleTime: boolean = false, filters: Filter<Beatmap>[]): Promise<Beatmap | undefined> => {
	const [conditionQuery, values] = generateSelectConditionQuery(filters, allowedFilters);
	const tableName: Tables = isDoubleTime ? Tables.double_time_beatmaps : Tables.beatmaps;
	const beatmap = await Database.oneOrNone<Beatmap>(`UPDATE ${tableName} SET last_requested = now() WHERE id = (SELECT id FROM ${tableName} 
		${conditionQuery} ORDER BY last_requested ASC LIMIT 1) 
		RETURNING id, bpm, hit_length, stream_length, accuracy, ar, cs, stream_density, difficulty_rating, title, ranked, last_updated`, values);
	return beatmap !== null ? beatmap : undefined;
};

/**
 * Retrieves an array of all the beatmaps from the database composed by the provided properties, filtered by dynamic and raw filters.
 *
 * @param properties - The properties that are expected to be part of the returned beatmaps.
 * @param filters - The dynamic filters with a variable property, value and conditional operator.
 * @returns A promise of an array of all the beatmaps that match the filters.
 */
const retrieveBeatmaps = async (properties: (keyof Beatmap)[] | '*' = '*', filters: Filter<Beatmap>[] = []): Promise<Beatmap[]> => {
	const formattedProperties = properties === '*' ? properties : properties.join(', ');
	const [conditionQuery, values] = generateSelectConditionQuery(filters, allowedFilters);
	return Database.manyOrNone<Beatmap>(`SELECT ${formattedProperties} FROM ${Tables.beatmaps} ${conditionQuery}`, values);
};

/**
 * Retrieves an array of beatmaps from the database composed by the provided properties, filtered by dynamic and raw filters,
 * with a page that indicates the offset to apply and sorted by a specific order.
 *
 * @param page - The page which is then multiplied by 12, the result of this operation indicates the offset.
 * @param sort - The dynamic with a variable property and order.
 * @param filters - The dynamic filters with a variable property, value and conditional operator.
 * @returns A promise of an array with the beatmaps that match the filters and the page offset in the provided order in the first position and
 * the total amount of beatmaps that match the filters in the second position.
 */
const retrieveBeatmapsByPage = async (page: number, sort: Sort<Beatmap>,
	filters: Filter<Beatmap>[] = []): Promise<[rows: Beatmap[], count: number]> => {
	const [conditionQuery, values] = generateSelectConditionQuery(filters, allowedFilters);
	values.push((page - 1) * 12);
	return Database.tx<[rows: Beatmap[], count: number]>(
		{mode: new txMode.TransactionMode({tiLevel: txMode.isolationLevel.readCommitted, readOnly: true})}, async (transaction: ITask<any>) => {
			const rows = await transaction.manyOrNone<Beatmap>(`SELECT id, beatmapset_id, favourite_count, play_count, bpm, stream_length, 
				difficulty_rating, active, title, ranked FROM ${Tables.beatmaps} ${conditionQuery} 
				${generateOrderQuery(sort.property, sort.order, ['bpm', 'favourite_count', 'difficulty_rating', 'last_updated'])} 
				LIMIT 12 OFFSET $${values.length}`, values);
			return [rows, (await transaction.one(`SELECT COUNT(id) FROM ${Tables.beatmaps} ${conditionQuery}`, values)).count];
		});
};

/**
 * Updates the properties present in the beatmap and its double time statistics in the database.
 *
 * @param beatmap - The beatmap's properties that will be updated except for the ID, which is required but not updated.
 * @param doubleTimeBeatmap - The double time statistics properties that will be updated.
 * @returns A promise of whether or not the beatmap statistics or double time statistics were updated.
 */
const updateBeatmap = async (beatmap: Beatmap, doubleTimeBeatmap: Beatmap = {}): Promise<boolean> => Database.tx(
	{mode: new txMode.TransactionMode({tiLevel: txMode.isolationLevel.readCommitted, readOnly: false})}, async (transaction: ITask<any>) => {
		let updatedRows = 0;
		let [query, values] = generateUpdateQuery(Tables.beatmaps, beatmap);
		if (query) updatedRows += (await transaction.result(query, values)).rowCount;
		doubleTimeBeatmap.id = beatmap.id;
		[query, values] = generateUpdateQuery(Tables.double_time_beatmaps, doubleTimeBeatmap);
		if (query) updatedRows += (await transaction.result(query, values)).rowCount;
		return updatedRows > 0;
	});

/**
 * Deletes a beatmap and its double time statistics from the database with a provided ID.
 *
 * @param id - The ID of the beatmap that will be deleted.
 * @returns A promise of whether the beatmap was deleted.
 */
const deleteBeatmap = async (id: number): Promise<boolean> => (await Database.result(`DELETE FROM ${Tables.beatmaps} WHERE id = $1`, [id])).rowCount >
	0;

export default Beatmap;
export {
	Ranked, createBeatmapFromOsuApi, createDoubleTimeBeatmap, createBeatmap, retrieveBeatmap, retrieveBeatmapRequest, retrieveBeatmaps,
	retrieveBeatmapsByPage, updateBeatmap, deleteBeatmap
};
