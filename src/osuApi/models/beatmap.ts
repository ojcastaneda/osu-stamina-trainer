import Beatmapset from './beatmapset';

/**
 * Class that represents the beatmaps retrieved from the osu! API.
 */
interface Beatmap {
	/**
	 * The beatmap's id.
	 */
	id: number;

	/**
	 * The beatmap's beatmapset id.
	 */
	beatmapset_id: number;

	/**
	 * The beatmap's drain length measured in seconds.
	 */
	hit_length: number;

	/**
	 * The beatmap's overall difficulty.
	 */
	accuracy: number;

	/**
	 * The beatmap's circle size.
	 */
	ar: number;

	/**
	 * The beatmap's approach rate.
	 */
	cs: number;

	/**
	 * The beatmap's difficulty.
	 */
	difficulty_rating: number;

	/**
	 * The beatmap's version of the beatmapset.
	 */
	version: string;

	/**
	 * The beatmap's hash identifier.
	 */
	checksum: string;

	/**
	 * The beatmap's ranked status.
	 */
	ranked: number;

	/**
	 * The beatmap's date when it was last updated.
	 */
	last_updated: Date;

	/**
	 * The beatmap's beatmapset where it belongs to.
	 */
	beatmapset: Beatmapset;

	/**
	 * The beatmap's game mode.
	 */
	mode: string;
}

export default Beatmap;
