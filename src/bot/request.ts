import dictionary from './dictionary';
import {Filter, Request, RequestResponse} from './models';
import ApiService from '../processing/services/api';

const ranges = {
	ar: 0.5,
	average: 2,
	bpm: 5,
	cs: 0.5,
	density: 0.1,
	length: 5,
	od: 0.5,
	stars: 0.5,
	year: 0
};

const processNumericParameter = (name: string, parameter: string, format: string): any[] => {
	if (ranges.hasOwnProperty(name)) {
		switch (format) {
			case 'exact':
				const exactNumber = Number(parameter.slice(0, -1));
				if (!isNaN(exactNumber))
					if (exactNumber >= 0 && exactNumber <= Number.MAX_SAFE_INTEGER) {
						if (name === 'year') {
							return [new Filter('last_updated', 'minimum', `${exactNumber}-01-01`),
								new Filter('last_updated', 'maximum', `${exactNumber + 1}-01-01`)];
						}
						return [new Filter(name, 'exact', exactNumber)];
					}
				break;
			case 'minimum':
				const minimumNumber = Number(parameter);
				if (!isNaN(minimumNumber))
					if (minimumNumber >= 0 && minimumNumber <= Number.MAX_SAFE_INTEGER) {
						if (name === 'year')
							return [new Filter('last_updated', 'minimum', `${minimumNumber}-01-01`)];
						return [new Filter(name, 'minimum', minimumNumber)];
					}
				break;
			case 'maximum':
				const maximumNumber = Number(parameter);
				if (!isNaN(maximumNumber)) {
					if (maximumNumber >= 0 && maximumNumber <= Number.MAX_SAFE_INTEGER) {
						if (name === 'year') return [new Filter('last_updated', 'maximum', `${maximumNumber + 1}-01-01`)];
						return [new Filter(name, 'maximum', maximumNumber)];
					}
				}
				break;
		}
	}
	return [undefined];
};

const processValueParameter = (parameter: string): any[] => {
	if (parameter) {
		switch (parameter[0]) {
			case 'b':
				return [new Filter('average', 'maximum', 8)];
			case 's':
				return [new Filter('average', 'maximum', 24), new Filter('average', 'minimum', 9)];
			case 'd':
				return [new Filter('average', 'minimum', 25)];
			case 'r':
				return [new Filter('ranked_status', 'exact', 'ranked')];
			case 'u':
				return [new Filter('ranked_status', 'exact', 'unranked')];
			case 'l':
				return [new Filter('ranked_status', 'exact', 'loved')];
		}
	}
	return [undefined];
};

const processParameter = (fullParameter: string): any[] => {
	if (fullParameter.indexOf('=') > 0) {
		let index = fullParameter.indexOf('=');
		const name = fullParameter.slice(0, index);
		let parameter: any = fullParameter.slice(index + 1);
		index = parameter.indexOf('-');
		if (index < 0) {
			// @ts-ignore
			parameter = [Number(parameter) - ranges[name], Number(parameter) + ranges[name]];
			return processNumericParameter(name, parameter[0], 'minimum').concat(processNumericParameter(name, parameter[1], 'maximum'));
		} else if (index === parameter.length - 1) {
			return processNumericParameter(name, parameter, 'exact');
		} else {
			parameter = parameter.split('-');
			return processNumericParameter(name, parameter[0], 'minimum'), processNumericParameter(name, parameter[1], 'maximum');
		}
	} else if (fullParameter.indexOf('<') > 0) {
		const index = fullParameter.indexOf('<');
		const numericFilter = processNumericParameter(fullParameter.slice(0, index), fullParameter.slice(index + 1), 'maximum');
		return numericFilter;
	} else if (fullParameter.indexOf('>') > 0) {
		const index = fullParameter.indexOf('>');
		const numericFilter = processNumericParameter(fullParameter.slice(0, index), fullParameter.slice(index + 1), 'minimum');
		return numericFilter;
	} else
		return processValueParameter(fullParameter);
	return [undefined];
};

const makeResponse = (requestResponse: RequestResponse) => {
	const {beatmap, isDoubleTime} = requestResponse;
	let seconds: any = beatmap.length! % 60;
	if (seconds < 10) seconds = `0${seconds}`;
	let additionalMods = '', type;
	if (isDoubleTime) additionalMods = ' +DT |';
	if (beatmap.average! < 9)
		type = 'bursts';
	else if (beatmap.average! < 25)
		type = 'streams';
	else
		type = 'deathstreams';
	const date = new Date();
	const response = `${additionalMods} BPM: ${beatmap.bpm} | `.concat(`Type: ${type} | `,
		`Average stream length: ${beatmap.average} | Density: ${beatmap.density} | ${beatmap.stars} ★ | AR: ${beatmap.ar} | `,
		`OD: ${beatmap.od} | CS: ${beatmap.cs} | Status: ${beatmap.ranked_status} | `,
		`Length: ${Math.floor(beatmap.length! / 60)}:${seconds}`);
	if (date.getUTCDate() === 27 && date.getUTCMonth() === 6)
		return (`[https://osu.ppy.sh/b/${beatmap.id} Blue Zenith [FOUR DIMENSIONS]]`).concat(response);
	return (`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.name}]`).concat(response);
};

const request = async (params: string[], apiService: ApiService): Promise<string> => {
	params = params.filter((param) => param != null);
	if (params.length > 0) {
		let request = new Request();
		if (params[0][0] === '<' || params[0][0] === '>') params[0] = `bpm${params[0]}`;
		else params[0] = `bpm=${params[0]}`;
		const bpm = processParameter(params[0]);
		if (bpm !== undefined) {
			request.filters = request.filters.concat(bpm);
			for (let i = 1; i < params.length; i++) {
				switch (params[i]) {
					case 'nomod':
						request.isDoubleTime = false;
						break;
					case 'dt':
						request.isDoubleTime = true;
						break;
					default:
						try {
							const processedParameter = processParameter(params[i]);
							console.log(processedParameter);
							if (!processedParameter.includes(undefined)) request.filters = request.filters.concat(processedParameter);
							else return dictionary.commandIncorrectParams;
						} catch (error) {
							return dictionary.commandIncorrectParams;
						}
						break;
				}
			}
			const requestResponse = await apiService.retrieveRequest(request);
			if (typeof requestResponse === 'number')
				switch (requestResponse) {
					case 404:
						return dictionary.noBeatmapsFound;
					case 500:
						return dictionary.serverNotAvailable;
					case 400:
						return dictionary.commandIncorrectParams;
				}
			else return makeResponse(requestResponse);
		}
	}
	return dictionary.commandIncorrectParams;
};

export default request;