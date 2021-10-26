import DoubleTimeBeatmap from '../models/api/doubleTimeBeatmap';
import Beatmap from '../models/api/beatmap';
import State from '../models/api/state';
import Submission from '../models/api/submission';
import HonoredBeatmap from '../models/api/honoredBeatmap';
import {RequestResponse, Request} from '../../bot/models';
import fetch, {Headers} from 'cross-fetch';

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
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${json['token']}`
		});
	}
}

/**
 * Class that represents the service in charge of interacting with the osu! Stamina Trainer API
 */
class ApiService {

	/**
	 * The custom authorization headers for interacting with the osu! Stamina Trainer API
	 * @type RequestHeaders
	 */
	public authorizationHeaders!: AuthorizationHeaders;

	/**
	 * Retrieves the authorization token from the osu! API
	 * @param {number} clientId The client ID credentials from the osu! API
	 * @param {string} clientSecret The client secret credentials from the osu! API
	 * @return {Promise<boolean>} The promise of an indicator of success from the retrieval
	 */
	public retrieveToken = async (): Promise<boolean> => {
		const response = await fetch(`${process.env.SERVER_API}requestToken`, {
			method: 'POST',
			headers: new Headers({
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}),
			body: JSON.stringify({
				'username': process.env.SERVER_USERNAME,
				'password': process.env.SERVER_PASSWORD
			})
		});
		if (response.ok) {
			this.authorizationHeaders = new AuthorizationHeaders(await response.json());
			return true;
		}
		return false;
	};

	public retrieveState = async (): Promise<State | undefined> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/state`, {
			method: 'GET',
			headers: this.authorizationHeaders
		});
		if (response.ok) return (await response.json()) as State;
	};

	public updateState = async (state: State): Promise<boolean> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/state`, {
			method: 'POST',
			headers: this.authorizationHeaders,
			body: JSON.stringify(state)
		});
		return response.ok;
	};

	public createBeatmap = async (beatmap: Beatmap, doubleTimeBeatmap: DoubleTimeBeatmap, isSubmission: boolean = false): Promise<boolean> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/beatmaps`, {
			method: 'POST',
			headers: this.authorizationHeaders,
			body: JSON.stringify({beatmap, doubleTimeBeatmap, isSubmission})
		});
		return response.ok;
	};

	public retrieveBeatmaps = async (): Promise<Beatmap[]> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/beatmaps`, {
			method: 'GET',
			headers: this.authorizationHeaders
		});
		if (response.ok) return (await response.json()) as Beatmap[];
		return [];
	};

	public retrieveBeatmapsFromSubmissions = async (): Promise<Beatmap[]> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/beatmaps/submissions`, {
			method: 'GET',
			headers: this.authorizationHeaders
		});
		if (response.ok) return (await response.json()) as Beatmap[];
		return [];
	};

	public retrievePendingBeatmapsFromSubmissions = async (): Promise<Submission[]> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/beatmaps/pending`, {
			method: 'GET',
			headers: this.authorizationHeaders
		});
		if (response.ok) return (await response.json()) as Submission[];
		return [];
	};

	public updateCollection = async (): Promise<boolean> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/collection`, {
			method: 'POST',
			headers: this.authorizationHeaders
		});
		return response.ok;
	};

	public resubmitSubmission = async (id: number): Promise<boolean> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/submissions`, {
			method: 'POST',
			headers: this.authorizationHeaders,
			body: JSON.stringify({id})
		});
		return response.ok;
	};

	public rankSubmission = async (id: number): Promise<boolean> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/submissions/${id}/rank`, {
			method: 'PUT',
			headers: this.authorizationHeaders
		});
		return response.ok;
	};

	public downloadSubmission = async (id: number): Promise<string | undefined> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/submissions/${id}/download`, {
			method: 'GET',
			headers: this.authorizationHeaders
		});
		if (response.ok) return await response.text();
	};

	public deleteSubmission = async (id: number): Promise<boolean> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/submissions/${id}`, {
			method: 'DELETE',
			headers: this.authorizationHeaders
		});
		return response.ok;
	};

	public createHonoredBeatmap = async (honoredBeatmap: HonoredBeatmap): Promise<boolean> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/honoredBeatmaps`, {
			method: 'POST',
			headers: this.authorizationHeaders,
			body: JSON.stringify(honoredBeatmap)
		});
		return response.ok;
	};

	public retrieveHonoredBeatmaps = async (): Promise<HonoredBeatmap[]> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/honoredBeatmaps`, {
			method: 'GET',
			headers: this.authorizationHeaders
		});
		if (response.ok) return (await response.json()) as HonoredBeatmap[];
		return [];
	};

	public retrievePendingHonoredBeatmaps = async (): Promise<Submission[]> => {
		const response = await fetch(`${process.env.SERVER_API}dataProcessing/honoredBeatmaps/pending`, {
			method: 'GET',
			headers: this.authorizationHeaders
		});
		if (response.ok) return (await response.json()) as Submission[];
		return [];
	};

	public retrieveRequest = async (request: Request): Promise<RequestResponse | number> => {
		const response = await fetch(`${process.env.SERVER_API}bot/request`, {
			method: 'POST',
			headers: this.authorizationHeaders,
			body: JSON.stringify(request)
		});
		if (response.ok) return (await response.json()) as RequestResponse;
		else return response.status;
	};
}

export default ApiService;