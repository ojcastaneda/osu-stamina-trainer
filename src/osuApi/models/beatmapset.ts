import Beatmap from './beatmap';

/**
 * Class that represents the beatmapsets retrieved from the osu! API.
 */
class Beatmapset {
	/**
	 * The beatmapset's id.
	 */
	public id: number;

	/**
	 * The beatmapset's song's name.
	 */
	public title: string;

	/**
	 * The beatmapset's date when it was ranked.
	 */
	public rankedDate?: Date;

	/**
	 * The beatmapset's ranked status.
	 */
	public ranked: number;

	/**
	 * The beatmapset's number of favorites.
	 */
	public favourites: number;

	/**
	 * The beatmapset's beatmaps.
	 */
	public beatmaps?: Beatmap[];

	/**
	 * Creates an instance of a beatmapset based on the osu! API beatmapset model.
	 *
	 * @param json - The json object which contains osu! API retrieved information for a specific beatmapset.
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
