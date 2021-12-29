import Beatmap, {createBeatmapFromOsuApi} from '../server/models/beatmap';
import OsuBeatmapset from './models/beatmapset';
import fetch, {Headers} from 'cross-fetch';
import OsuBeatmap from './models/beatmap';

/**
 * The url of the osu! API.
 */
const apiUrl: string = 'https://osu.ppy.sh/api/v2/';

/**
 * Class that represents the service in charge of interacting with the osu! API.
 */
class OsuService {

	/**
	 * The custom authorization headers for interacting with the osu! API.
	 */
	private authorizationHeaders!: AuthorizationHeaders;

	/**
	 * The date in milliseconds when the last dumped data from https://data.ppy.sh/ was supposedly released.
	 */
	private lastMonth!: number;

	/**
	 * Retrieves the authorization token from the osu! API.
	 *
	 * @returns A promise of an indicator of success from the retrieval.
	 */
	public retrieveToken = async (): Promise<boolean> => {
		const response = await fetch('https://osu.ppy.sh/oauth/token', {
			method: 'POST', headers: new Headers({
				Accept: 'application/json', 'Content-Type': 'application/json'
			}), body: JSON.stringify({
				client_id: process.env.OSU_ID, client_secret: process.env.OSU_SECRET, grant_type: 'client_credentials', scope: 'public'
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
	 * Retrieves the ranked beatmaps from the osu! API since a provided beatmapset starting point.
	 *
	 * @param lastBeatmapset - The beatmapset's ID from the last beatmapset from the last iteration.
	 * @param lastDateMilliseconds - The beatmapset's date when it was ranked from the last beatmapset from the last iteration.
	 * @returns A promise of an array with the beatmaps found, the ID of the last beatmapset, the date when the last beatmapset was ranked and the
	 * continuation signal if there are more beatmaps available given the date limit of the last dumped data.
	 */
	public retrieveRankedBeatmaps = async (lastDate: number,
		lastBeatmapset: number): Promise<[beatmaps: Beatmap[], lastDate: number, lastBeatmapset: number, beatmapsLeft: boolean]> => {
		try {
			const beatmaps: Beatmap[] = [];
			const params = [`m=0`, 'sort=ranked_asc', 'nsfw=true', `cursor[_id]=${lastBeatmapset}`, `cursor[approved_date]=${lastDate}`];
			const response = await fetch(`${apiUrl}beatmapsets/search?${params.join('&')}`, {
				method: 'GET', headers: this.authorizationHeaders
			});
			if (response.ok) {
				const {beatmapsets, cursor} = (await response.json()) as { beatmapsets: OsuBeatmapset[], cursor: Cursor };
				if (cursor.approved_date < this.lastMonth) {
					beatmapsets.forEach(beatmapset => this.includeBeatmaps(beatmaps, beatmapset));
					return [beatmaps, cursor.approved_date, cursor._id, true];
				} else {
					beatmapsets.forEach(beatmapset => {
						const rankedDate = new Date(beatmapset.ranked_date!).getTime();
						if (beatmapset.ranked_date !== null && rankedDate < this.lastMonth) {
							cursor._id = beatmapset.id;
							cursor.approved_date = rankedDate;
							this.includeBeatmaps(beatmaps, beatmapset);
						}
					});
					return [beatmaps, cursor.approved_date, cursor._id, false];
				}
			}
		} catch (error) {
			console.log(error);
		}
		return [[], lastDate, lastBeatmapset, false];
	};

	/**
	 * Retrieves the beatmap a specific ID from the osu! API.
	 *
	 * @param id - The ID of the beatmap.
	 * @returns A promise of the beatmap provided if available or undefined if not.
	 */
	public retrieveBeatmap = async (id: number): Promise<Beatmap | undefined> => {
		const response = await fetch(`${apiUrl}beatmaps/${id}`, {
			method: 'GET', headers: this.authorizationHeaders
		});
		if (response.ok) {
			const beatmap = await response.json() as OsuBeatmap;
			if (beatmap.mode === 'osu') return createBeatmapFromOsuApi(beatmap, beatmap.beatmapset);
		}
	};

	/**
	 * Adds to an existing beatmap array the beatmaps filtered from a beatmapset from the osu! API.
	 *
	 * @param beatmaps - The beatmaps array where the beatmaps are going to be added.
	 * @param beatmapset - The osu! API beatmapset with the beatmaps to add.
	 */
	private includeBeatmaps = (beatmaps: Beatmap[], beatmapset: OsuBeatmapset): void => {
		beatmapset.beatmaps.forEach(beatmap => {
			if ((beatmap.ranked === 1 || beatmap.ranked === 2) && beatmap.mode === 'osu') beatmaps.push(createBeatmapFromOsuApi(beatmap, beatmapset));
		});
	};
}

/**
 * Class that represents the entity for iterating through the beatmapsets collection from the osu! API.
 */
interface Cursor {
	/**
	 * The date when the last beatmapset retrieved was ranked.
	 */
	approved_date: number;

	/**
	 * The identifier of the last beatmapset.
	 */
	_id: number;
}

/**
 * Class that represents the custom authorization headers for interacting with the osu! API.
 */
class AuthorizationHeaders extends Headers {
	/**
	 * Creates an instance of an authorization headers for interacting with the osu! API.
	 *
	 * @param json - The json object which contains osu! API authorization response.
	 */
	constructor(json: any) {
		super({
			Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${json['access_token']}`
		});
	}
}

export default OsuService;
export {Cursor};
