import Beatmapset from './beatmapset';

/**
 * Class that represents the beatmaps retrieved from the osu! API.
 */
class Beatmap {
	/**
	 * The beatmap's id.
	 */
	public id: number;

	/**
	 * The beatmap's game mode.
	 */
	public mode: string;

	/**
	 * The beatmap's circle size.
	 */
	public ar: number;

	/**
	 * The beatmap's overall difficulty.
	 */
	public od: number;

	/**
	 * The beatmap's approach rate.
	 */
	public cs: number;

	/**
	 * The beatmap's version of the beatmapset.
	 */
	public version: string;

	/**
	 * The beatmap's drain length measured in seconds.
	 */
	public length: number;

	/**
	 * The beatmap's suggested beats per minute.
	 */
	public bpm: number;

	/**
	 * The beatmap's hash identifier.
	 */
	public hash: string;

	/**
	 * The beatmap's ranked status.
	 */
	public ranked: number;

	/**
	 * The beatmap's date when it was last updated.
	 */
	public lastUpdated: Date;

	/**
	 * The beatmap's difficulty.
	 */
	public stars: number;

	/**
	 * The beatmap's beatmapset where it belongs to.
	 */
	public beatmapset?: Beatmapset;

	/**
	 * Creates an instance of a beatmap based on the osu! API beatmap model.
	 *
	 * @param json - The json object which contains osu! API retrieved information for a specific beatmap.
	 */
	constructor(json: any) {
		this.id = json.id;
		this.mode = json.mode;
		this.ar = json.ar;
		this.od = json.accuracy;
		this.cs = json.cs;
		this.version = json.version;
		this.length = json.hit_length;
		this.bpm = json.bpm;
		this.hash = json.checksum;
		this.ranked = json.ranked;
		this.lastUpdated = new Date(json.last_updated);
		this.stars = json.difficulty_rating;
		if (json.beatmapset) this.beatmapset = new Beatmapset(json.beatmapset);
	}
}

export default Beatmap;
