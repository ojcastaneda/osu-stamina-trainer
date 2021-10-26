import Beatmapset from './beatmapset';

/**
 * Class that represents the beatmaps retrieved from the osu! API
 */
class Beatmap {
	/**
	 * The beatmap's id
	 * @type number
	 */
	public id!: number;

	/**
	 * The beatmap's game mode
	 * @type string
	 */
	public mode!: string;


	/**
	 * The beatmap's circle size
	 * @type number
	 */
	public ar!: number;


	/**
	 * The beatmap's circle size
	 * @type number
	 */
	public od!: number;

	/**
	 * The beatmap's circle size
	 * @type number
	 */
	public cs!: number;

	/**
	 * The beatmap's version of the beatmapset
	 * @type string
	 */
	public version!: string;

	/**
	 * The beatmap's drain length measured in seconds
	 * @type number
	 */
	public length!: number;

	/**
	 * The beatmap's most frequent beats per minute
	 * @type number
	 */
	public bpm!: number;

	/**
	 * The beatmap's hash identifier
	 * @type string
	 */
	public hash!: string;

	/**
	 * The beatmap's ranked status
	 * @type string
	 */
	public ranked!: number;

	/**
	 * The beatmap's last update's date
	 * @type Date
	 */
	public lastUpdated!: Date;

	/**
	 * The beatmap's difficulty
	 * @type number
	 */
	public stars!: number;

	/**
	 * The beatmap's beatmapset where it belongs to
	 * @type {(number | undefined)}
	 */
	public beatmapset!: Beatmapset;

	/**
	 * Creates an instance of a beatmap based on the osu! API beatmap model
	 * @param json The json object which contains osu! API retrieved information for a specific beatmap
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
		if (json.beatmapset)
			this.beatmapset = new Beatmapset(json.beatmapset);
	}
}

export default Beatmap;