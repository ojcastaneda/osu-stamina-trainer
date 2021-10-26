import {ProcessingBeatmap} from '../processingBeatmap';

/**
 * Class that represents the beatmaps archived in the collection
 */
class Beatmap {
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
	 * The beatmap's highest beats per minute during streams
	 * @type {number}
	 */
	public bpm?: number;

	/**
	 * The beatmap's drain length measured in seconds
	 * @type {number}
	 */
	public length?: number;

	/**
	 * The beatmap's streams weighted average length
	 * @type {number}
	 */
	public average?: number;

	/**
	 * The beatmap's approach rate
	 * @type {number}
	 */
	public ar?: number;

	/**
	 * The beatmap's overall difficulty
	 * @type {number}
	 */
	public od?: number;

	/**
	 * The beatmap's circle size
	 * @type {number}
	 */
	public cs?: number;

	/**
	 * The beatmap's difficulty
	 * @type {number}
	 */
	public stars?: number;

	/**
	 * The beatmap's stream to hit object ratio
	 * @type {number}
	 */
	public density?: number;

	/**
	 * The beatmap's active status for interactions
	 * @type {boolean}
	 */
	public active_status?: boolean;

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
	 * The beatmap's last date requested
	 * @type {Date}
	 */
	public last_requested?: Date;

	/**
	 * The beatmap's last date requested
	 * @type {Date}
	 */
	public last_updated?: Date;

	public constructor(beatmap: ProcessingBeatmap) {
		this.id = beatmap.id;
		this.set_id = beatmap.setId;
		this.bpm = Math.round(beatmap.bpm);
		this.favorites = beatmap.favorites;
		this.length = Math.round(beatmap.length);
		this.average = beatmap.average;
		this.ar = Number(beatmap.ar.toFixed(1));
		this.od = Number(beatmap.od.toFixed(1));
		this.cs = Number(beatmap.cs.toFixed(1));
		this.stars = Number(beatmap.stars.toFixed(2));
		this.density = beatmap.density;
		this.name = beatmap.name;
		this.hash = beatmap.hash;
		this.ranked_status = beatmap.rankedStatus;
		this.last_updated = beatmap.lastUpdated;
	}

}

export default Beatmap;