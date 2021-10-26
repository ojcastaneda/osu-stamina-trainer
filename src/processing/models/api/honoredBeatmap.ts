/**
 * Class that represents the beatmaps archived in the special collection for irregular beatmaps
 */
import {ProcessingBeatmap} from '../processingBeatmap';

class HonoredBeatmap {
	/**
	 * The beatmap's ID
	 * @type {number}
	 */
	public id!: number;

	/**
	 * The beatmap's set's ID
	 * @type {number}
	 */
	public set_id?: number;

	/**
	 * The beatmap's number of favorites from users
	 * @type {number}
	 */
	public favorites?: number;

	/**
	 * The beatmap's difficulty
	 * @type {number}
	 */
	public stars?: number;

	/**
	 * The beatmap's name composed by the song's name and the beatmap version
	 * @type {string}
	 */
	public name?: string;

	/**
	 * The beatmap's hash identifier
	 * @type {string}
	 */
	public hash?: string;

	/**
	 * The beatmap's ranked status
	 * @type {string}
	 */
	public ranked_status?: string;

	/**
	 * The beatmap's date when either the beatmap was ranked or last updated if the beatmap is not ranked
	 * @type {Date}
	 */
	public last_updated?: Date;

	public constructor(beatmap: ProcessingBeatmap) {
		this.id = beatmap.id;
		this.set_id = beatmap.setId;
		this.favorites = beatmap.favorites;
		this.stars = beatmap.stars;
		this.name = beatmap.name;
		this.hash = beatmap.hash;
		this.ranked_status = beatmap.rankedStatus;
		this.last_updated = beatmap.lastUpdated;
	}
}

export default HonoredBeatmap;