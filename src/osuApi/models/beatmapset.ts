import Beatmap from './beatmap';

/**
 * Class that represents the beatmapsets retrieved from the osu! API
 */
class Beatmapset {
	/**
	 * The beatmapset's id
	 * @type number
	 */
	public id!: number;

	/**
	 * The beatmapset's song's name
	 * @type string
	 */
	public title!: string;

	/**
	 * The beatmapset's date where it was ranked
	 * @type {(Date| undefined)}
	 */
	public rankedDate!: Date | undefined;

	/**
	 * The beatmapset's ranked status
	 * @type string
	 */
	public ranked!: number;

	/**
	 * The beatmapset's number of favorites from users
	 * @type number
	 */
	public favourites!: number;

	/**
	 * The beatmapset's beatmaps
	 * @type {(Beatmap | undefined)}
	 */
	public beatmaps!: Beatmap[] | undefined;

	/**
	 * Creates an instance of a beatmapset based on the osu! API beatmapset model
	 * @param json The json object which contains osu! API retrieved information for a specific beatmapset
	 */
	constructor(json: any) {
		this.id = json.id;
		this.title = json.title;
		if (json.ranked_date) this.rankedDate = new Date(json.ranked_date);
		this.ranked = json.ranked;
		this.favourites = json.favourite_count;
		if (json.beatmaps != undefined) {
			this.beatmaps = [];
			this.beatmaps = json.beatmaps.map((beatmap: any) => new Beatmap(beatmap));
		}
	}
}

export default Beatmapset;