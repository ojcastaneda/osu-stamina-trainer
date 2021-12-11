import OsuBeatmapset from './models/beatmapset';
import Beatmap from '../server/models/beatmap';
import fetch, { Headers } from 'cross-fetch';
import OsuBeatmap from './models/beatmap';

/**
 * Class that represents the entity for iterating through the beatmapsets collection from the osu! API
 */
class Cursor {
	/**
	 * The date when the last beatmapset retrieved was ranked
	 * @type number
	 */
	public lastDate!: number;

	/**
	 * The identifier of the last beatmapset
	 * @type number
	 */
	public lastBeatmapset!: number;

	/**
	 * Creates an instance of a cursor based on the osu! API response for iterating through the beatmapsets collection
	 * @param json The json object which contains osu! API entity for iterating through the beatmapsets collection
	 */
	constructor(json: any) {
		this.lastDate = json['approved_date'];
		this.lastBeatmapset = json['_id'];
	}
}

/**
 * Class that represents the custom authorization headers for interacting with the osu! API
 */
class AuthorizationHeaders extends Headers {
	/**
	 * Creates an instance of an authorization headers for interacting with the osu! API
	 * @param json The json object which contains osu! API authorization response
	 */
	constructor(json: any) {
		super({
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${json['access_token']}`
		});
	}
}

/**
 * Class that represents the service in charge of interacting with the osu! API
 */
class OsuService {
	/**
	 * The url of the osu! API
	 * @type string
	 */
	private static apiUrl: string = 'https://osu.ppy.sh/api/v2/';

	/**
	 * The custom authorization headers for interacting with the osu! API
	 * @type RequestHeaders
	 */
	public authorizationHeaders!: AuthorizationHeaders;

	/**
	 * The date in milliseconds when the last dumped data from https://data.ppy.sh/ was supposedly released
	 * @type RequestHeaders
	 */
	private lastMonth!: number;

	/**
	 * Retrieves the authorization token from the osu! API
	 * @param {number} clientId The client ID credentials from the osu! API
	 * @param {string} clientSecret The client secret credentials from the osu! API
	 * @return {Promise<boolean>} The promise of an indicator of success from the retrieval
	 */
	public retrieveToken = async (): Promise<boolean> => {
		const response = await fetch('https://osu.ppy.sh/oauth/token', {
			method: 'POST',
			headers: new Headers({
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}),
			body: JSON.stringify({
				client_id: process.env.OSU_ID,
				client_secret: process.env.OSU_SECRET,
				grant_type: 'client_credentials',
				scope: 'public'
			})
		});
		if (response.ok) {
			const currentDate = new Date();
			this.lastMonth = Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1);
			this.authorizationHeaders = new AuthorizationHeaders(await response.json());
			return true;
		}
		return false;
	};

	/**
	 * Retrieves the ranked beatmaps from the osu! API since a specified beatmapset starting point
	 * @param {number} lastBeatmapset The beatmapset's ID from the last beatmapset from the last iteration
	 * @param {number} lastDateMilliseconds The beatmapset's date when it was ranked from the last beatmapset from the last iteration
	 * @return {Promise<[beatmaps: ProcessingBeatmap[], lastId: number, lastDateMilliseconds: number, beatmapsLeft: boolean]>}
	 * The promise of an array with the beatmaps found, the ID of the last beatmapset, the date when the last beatmapset was ranked and the
	 * continuation signal if there are more beatmaps available given the date limit of the last dumped data
	 */
	public retrieveRankedBeatmaps = async (
		lastDate: number,
		lastBeatmapset: number
	): Promise<[beatmaps: Beatmap[], lastDate: number, lastBeatmapset: number, beatmapsLeft: boolean]> => {
		try {
			const beatmaps: Beatmap[] = [];
			const params = [`m=0`, 'sort=ranked_asc', 'nsfw=true', `cursor[_id]=${lastBeatmapset}`, `cursor[approved_date]=${lastDate}`];
			const response = await fetch(`${OsuService.apiUrl}beatmapsets/search?${params.join('&')}`, {
				method: 'GET',
				headers: this.authorizationHeaders
			});
			if (response.ok) {
				const json: any = await response.json();
				const beatmapsets: OsuBeatmapset[] = json['beatmapsets'].map((beatmapset: any) => new OsuBeatmapset(beatmapset));
				const cursor = new Cursor(json['cursor']);
				if (cursor.lastDate < this.lastMonth) {
					beatmapsets.forEach(beatmapset => this.includeBeatmaps(beatmaps, beatmapset));
					return [beatmaps, cursor.lastDate, cursor.lastBeatmapset, true];
				} else {
					beatmapsets.forEach(beatmapset => {
						if (beatmapset.rankedDate != undefined && beatmapset.rankedDate!.getTime() < this.lastMonth) {
							cursor.lastBeatmapset = beatmapset.id;
							cursor.lastDate = beatmapset.rankedDate!.getTime();
							this.includeBeatmaps(beatmaps, beatmapset);
						}
					});
					return [beatmaps, cursor.lastDate, cursor.lastBeatmapset, false];
				}
			}
		} catch (error) {}
		return [[], lastDate, lastBeatmapset, false];
	};

	/**
	 * Retrieves the beatmap a specific ID from the osu! API
	 * @param {number} id the ID of the beatmap
	 * @return {Promise<(Beatmap | undefined)>} The promise of the beatmap specified if available
	 */
	public retrieveBeatmap = async (id: number): Promise<Beatmap | undefined> => {
		const response = await fetch(`${OsuService.apiUrl}beatmaps/${id}`, {
			method: 'GET',
			headers: this.authorizationHeaders
		});
		if (response.ok) {
			const beatmap = new OsuBeatmap(await response.json());
			if (beatmap.stars > 3 && beatmap.mode === 'osu' && beatmap.beatmapset)
				return Beatmap.createBeatmapFromOsuApi(beatmap, beatmap.beatmapset);
		}
	};

	/**
	 * Adds to an existing beatmap array the beatmaps filtered from a beatmapset from the osu! API
	 * @param beatmaps The beatmaps array where the beatmaps are going to be added
	 * @param beatmapset The osu! API beatmapset with the beatmaps to add
	 */
	private includeBeatmaps = (beatmaps: Beatmap[], beatmapset: OsuBeatmapset) => {
		if (beatmapset.beatmaps instanceof Array && (beatmapset.ranked === 1 || beatmapset.ranked === 2))
			beatmapset.beatmaps.forEach(beatmap => {
				if ((beatmap.ranked === 1 || beatmap.ranked === 2) && beatmap.stars > 3 && beatmap.mode === 'osu')
					beatmaps.push(Beatmap.createBeatmapFromOsuApi(beatmap, beatmapset));
			});
	};
}

export { Cursor };
export default OsuService;
