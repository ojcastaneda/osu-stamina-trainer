import { requestBeatmap } from '../server/logic/bot/beatmaps.logic';
import Beatmap from '../server/models/beatmap';
import Filter from '../server/models/filter';
import dictionary from './dictionary';

/**
 * The default ranges of the numeric filters.
 */
const ranges = { ar: 0.5, average: 2, bpm: 5, cs: 0.5, density: 0.1, length: 5, od: 0.5, stars: 0.5, year: 0 };

/**
 * Transforms an array of raw filters into a response message. If not, return an error message.
 *
 * @param rawFilters - The array of raw filters to transform.
 * @returns A promise of the response or error message.
 */
const request = async (rawFilters: string[]): Promise<string> => {
	rawFilters = rawFilters.filter(rawFilters => rawFilters != undefined);
	if (rawFilters.length < 1) return dictionary.commandIncorrectParams;
	let isDoubleTime;
	if (rawFilters[0][0] === '<' || rawFilters[0][0] === '>') rawFilters[0] = `bpm${rawFilters[0]}`;
	else rawFilters[0] = `bpm=${rawFilters[0]}`;
	const bpm = processRawFilter(rawFilters.shift()!);
	if (bpm.includes(undefined)) return dictionary.commandIncorrectParams;
	let filters = bpm;
	for (const rawFilter of rawFilters) {
		switch (rawFilter) {
			case 'nomod':
				isDoubleTime = false;
				break;
			case 'dt':
				isDoubleTime = true;
				break;
			default:
				const processedParameter = processRawFilter(rawFilter);
				if (!processedParameter.includes(undefined)) filters = filters.concat(processedParameter);
				else return dictionary.commandIncorrectParams;
				break;
		}
	}
	return makeResponse(await requestBeatmap(isDoubleTime, filters));
};

/**
 * Formats a response message based off of a beatmap and based on the modification used for the beatmap statistics.
 *
 * @param request - The request containing the beatmap and the modification used for the beatmap statistics.
 * @returns A string of the formatted response message.
 */
const makeResponse = (request: { beatmap: Beatmap | undefined; isDoubleTime: boolean }): string => {
	const { beatmap, isDoubleTime } = request;
	if (beatmap === undefined) return dictionary.noBeatmapsFound;
	let seconds: any = beatmap.length! % 60;
	if (seconds < 10) seconds = `0${seconds}`;
	const additionalMods = isDoubleTime ? ' +DT |' : '';
	const type = beatmap.average! < 9 ? 'bursts' : beatmap.average! < 25 ? 'streams' : 'deathstreams';
	const response =
		`${additionalMods} BPM: ${beatmap.bpm} | Type: ${type} | Average stream length: ${beatmap.average} | Density: ${beatmap.density} | ` +
		`${beatmap.stars} ★ | AR: ${beatmap.ar} | OD: ${beatmap.od} | CS: ${beatmap.cs} | Status: ${beatmap.ranked_status} | ` +
		`Length: ${Math.floor(beatmap.length! / 60)}:${seconds}`;
	const date = new Date();
	if (date.getUTCDate() === 27 && date.getUTCMonth() === 6) return `[https://osu.ppy.sh/b/${beatmap.id} Blue Zenith [FOUR DIMENSIONS]] ${response}`;
	return `[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.name}] ${response}`;
};

/**
 * Transforms a raw filter into an array of filter objects if the raw filter is well formed. If not, return an array containing undefined.
 *
 * @param rawFilter - The raw filter.
 * @returns An array with the generated filter objects or undefined.
 */
const processRawFilter = (rawFilter: string): any[] => {
	if (rawFilter.indexOf('=') > 0) {
		let index = rawFilter.indexOf('=');
		const name = rawFilter.slice(0, index);
		let parameter: any = rawFilter.slice(index + 1);
		index = parameter.indexOf('-');
		if (index < 0) {
			// @ts-ignore
			parameter = [Number(parameter) - ranges[name], Number(parameter) + ranges[name]];
			return processRawNumericFilter(name, parameter[0], 'minimum').concat(processRawNumericFilter(name, parameter[1], 'maximum'));
		} else if (index === parameter.length - 1) {
			return processRawNumericFilter(name, parameter, 'exact');
		} else {
			parameter = parameter.split('-');
			return processRawNumericFilter(name, parameter[0], 'minimum').concat(processRawNumericFilter(name, parameter[1], 'maximum'));
		}
	} else if (rawFilter.indexOf('<') > 0) {
		const index = rawFilter.indexOf('<');
		const numericFilter = processRawNumericFilter(rawFilter.slice(0, index), rawFilter.slice(index + 1), 'maximum');
		return numericFilter;
	} else if (rawFilter.indexOf('>') > 0) {
		const index = rawFilter.indexOf('>');
		const numericFilter = processRawNumericFilter(rawFilter.slice(0, index), rawFilter.slice(index + 1), 'minimum');
		return numericFilter;
	} else return processRawNonNumericFilter(rawFilter);
};

/**
 * Transforms a raw numeric filter into an array of filter objects if the raw filter is well formed. If not, returns an array containing undefined.
 *
 * @param name - The name of the raw numeric filter target property.
 * @param value - The value of the raw numeric filter.
 * @param format - The type of the raw numeric filter to generate with the raw filter's value ('exact', 'minimum' or 'maximum').
 * @returns An array with the generated filter objects or undefined.
 */
const processRawNumericFilter = (name: string, value: string, format: string): any[] => {
	if (!ranges.hasOwnProperty(name)) return [undefined];
	switch (format) {
		case 'exact':
			const exactNumber = Number(value.slice(0, -1));
			if (isNaN(exactNumber) || exactNumber < 0 || exactNumber > Number.MAX_SAFE_INTEGER) return [undefined];
			if (name === 'year')
				return [
					new Filter('last_updated', 'minimum', `${exactNumber}-01-01`),
					new Filter('last_updated', 'maximum', `${exactNumber + 1}-01-01`)
				];
			return [new Filter(name, 'exact', exactNumber)];
		case 'minimum':
			const minimumNumber = Number(value);
			if (isNaN(minimumNumber) || minimumNumber < 0 || minimumNumber > Number.MAX_SAFE_INTEGER) return [undefined];
			if (name === 'year') return [new Filter('last_updated', 'minimum', `${minimumNumber}-01-01`)];
			return [new Filter(name, 'minimum', minimumNumber)];
		case 'maximum':
			const maximumNumber = Number(value);
			if (isNaN(maximumNumber) || maximumNumber < 0 || maximumNumber > Number.MAX_SAFE_INTEGER) return [undefined];
			if (name === 'year') return [new Filter('last_updated', 'maximum', `${maximumNumber + 1}-01-01`)];
			return [new Filter(name, 'maximum', maximumNumber)];
		default:
			return [undefined];
	}
};

/**
 * Transforms a raw non numeric filter into an array of filter objects if the raw filter is well formed. If not, return an array containing undefined.
 *
 * @param rawFilter - The raw non numeric filter.
 * @returns An array with the generated filter objects or undefined.
 */
const processRawNonNumericFilter = (rawFilter: string): any[] => {
	if (!rawFilter) return [undefined];
	switch (rawFilter[0]) {
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
		default:
			return [undefined];
	}
};

export default request;
