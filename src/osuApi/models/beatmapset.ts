import Beatmap from './beatmap';

/**
 * Class that represents the beatmapsets retrieved from the osu! API.
 */
interface Beatmapset {
	/**
	 * The beatmapset's id.
	 */
	id: number;

	/**
	 * The beatmapset's number of favorites.
	 */
	favourite_count: number;

	/**
	 * The beatmapset's number of plays.
	 */
	play_count: number;

	/**
	 * The beatmapset's song title.
	 */
	title: string;

	/**
	 * The beatmapset's date when it was ranked.
	 */
	ranked_date?: Date;

	/**
	 * The beatmapset's beatmaps.
	 */
	beatmaps: Beatmap[];
}

export default Beatmapset;
