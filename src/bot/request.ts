import { requestBeatmap } from '../server/logic/bot/beatmaps.logic';
import Beatmap from '../server/models/beatmap';
import Filter from '../server/models/filter';

/**
 * The default ranges and limits of the numeric filters.
 */
import filtersProperties from './filtersProperties.json';

/**
 * Transforms an array of raw filters into a response message. If not, return an error message.
 *
 * @param rawFilters - The array of raw filters to transform.
 * @returns A promise of the response or error message.
 */
const request = async (rawFilters: string[]): Promise<{ beatmap: Beatmap | undefined; isDoubleTime: boolean } | string> => {
	rawFilters = rawFilters.filter(rawFilters => rawFilters != undefined);
	if (rawFilters.length < 1) return '180';
	const guessedCommand: string[] = [];
	const filters: Filter[] = [];
	let incorrectFilters = false;
	let isDoubleTime;
	const rawBpm = rawFilters.shift();
	const bpm = rawBpm![0] === '<' || rawBpm![0] === '>' ? `bpm${rawBpm!}` : `bpm=${rawBpm!}`;
	processRawFilter(bpm, true).forEach(parameter => {
		if (typeof parameter !== 'string') return filters.push(parameter);
		guessedCommand.push(parameter);
		incorrectFilters = true;
	});
	if (!incorrectFilters) guessedCommand.push(rawBpm!);
	for (const rawFilter of rawFilters) {
		const processedParameter = processRawFilter(rawFilter);
		let incorrectFilter = false;
		processedParameter.forEach(parameter => {
			if (typeof parameter !== 'string') {
				if (parameter.filterProperty !== 'modification') return filters.push(parameter);
				return isDoubleTime = parameter.value;
			}
			guessedCommand.push(parameter);
			incorrectFilter = true;
		});
		if (!incorrectFilter) guessedCommand.push(rawFilter);
		else incorrectFilters = true;
	}
	return incorrectFilters ? `${guessedCommand.join(' ')}` : await requestBeatmap(isDoubleTime, filters);
};

/**
 * Transforms a raw filter into an array of filter objects if the raw filter is well formed. If not, return an array containing undefined.
 *
 * @param rawFilter - The raw filter.
 * @returns An array with the generated filter objects or undefined.
 */
const processRawFilter = (rawFilter: string, isBpm: boolean = false): any[] => {
	if (rawFilter.indexOf('=') > 0) {
		let splitIndex = rawFilter.indexOf('=');
		const name = rawFilter.slice(0, splitIndex);
		//@ts-ignore
		if (filtersProperties[name] === undefined) return processNonNumericFilter(rawFilter, isBpm);
		const values = rawFilter.slice(splitIndex + 1);
		splitIndex = values.indexOf('-');
		if (splitIndex < 0) {
			const value = processRawNumericFilter(values, name, true);
			if (typeof value === 'string') return isBpm ? [`${value}`] : [`${name}=${value}`];
			// @ts-ignore
			return processNumericFilter(name, value - filtersProperties[name].range, 'minimum').concat(
				// @ts-ignore
				processNumericFilter(name, value + filtersProperties[name].range, 'maximum')
			);
		} else if (splitIndex === values.length - 1) {
			const value = processRawNumericFilter(values.slice(0, -1), name, true);
			if (typeof value === 'string') return isBpm ? [`${value}-`] : [`${name}=${value}-`];
			return processNumericFilter(name, value, 'exact');
		} else {
			const ranges = values.split('-');
			const minimum = processRawNumericFilter(ranges[0], name, true);
			const maximum = processRawNumericFilter(ranges[1], name, true);
			if (typeof minimum === 'string' || typeof maximum === 'string')
				return isBpm ? [`${minimum}-${maximum}`] : [`${name}=${minimum}-${maximum}`];
			return processNumericFilter(name, minimum, 'minimum').concat(processNumericFilter(name, maximum, 'maximum'));
		}
	} else if (rawFilter.indexOf('<') > 0) {
		const splitIndex = rawFilter.indexOf('<');
		const name = rawFilter.slice(0, splitIndex);
		//@ts-ignore
		if (filtersProperties[name] === undefined) return processNonNumericFilter(rawFilter, isBpm);
		const value = processRawNumericFilter(rawFilter.slice(splitIndex + 1), name, true);
		if (typeof value === 'string') return isBpm ? [`<${value}`] : [`${name}<${value}`];
		return processNumericFilter(name, value, 'maximum');
	} else if (rawFilter.indexOf('>') > 0) {
		const splitIndex = rawFilter.indexOf('>');
		const name = rawFilter.slice(0, splitIndex);
		//@ts-ignore
		if (filtersProperties[name] === undefined) return processNonNumericFilter(rawFilter, isBpm);
		const value = processRawNumericFilter(rawFilter.slice(splitIndex + 1), name, true);
		if (typeof value === 'string') return isBpm ? [`>${value}`] : [`${name}>${value}`];
		return processNumericFilter(name, value, 'minimum');
	}
	return processNonNumericFilter(rawFilter, isBpm);
};

/**
 * Transforms a numeric filter into an array of filter objects if the filter is well formed. If not, returns an array containing undefined.
 *
 * @param name - The name of the numeric filter target property.
 * @param value - The value of the numeric filter.
 * @param format - The type of the numeric filter to generate with the filter's value ('exact', 'minimum' or 'maximum').
 * @returns An array with the generated filter objects or undefined.
 */
const processNumericFilter = (name: string, value: number, format: string): Filter[] => {
	switch (format) {
		case 'exact':
			if (name === 'year')
				return [new Filter('last_updated', 'minimum', `${value}-01-01`), new Filter('last_updated', 'maximum', `${value + 1}-01-01`)];
			return [new Filter(name, 'exact', value)];
		case 'minimum':
			if (name === 'year') return [new Filter('last_updated', 'minimum', `${value}-01-01`)];
			return [new Filter(name, 'minimum', value)];
		case 'maximum':
			if (name === 'year') return [new Filter('last_updated', 'maximum', `${value + 1}-01-01`)];
			return [new Filter(name, 'maximum', value)];
		default:
			return [];
	}
};

const processRawNumericFilter = (rawNumber: string | number, propertyName: string, useDefaultRange: boolean = false): number | string => {
	if (typeof rawNumber === 'number') return rawNumber;
	// @ts-ignore
	const filterProperties = filtersProperties[propertyName];
	let number = Number(rawNumber);
	let parsingError = false;
	if (isNaN(number)) {
		number = parseFloat(rawNumber);
		if (isNaN(number)) return `${filterProperties.default}`;
		parsingError = true;
	}
	if (number + (useDefaultRange ? filterProperties.range : 0) < filterProperties.minimum) return `${filterProperties.minimum}`;
	if (filterProperties.maximum !== undefined && number - (useDefaultRange ? filterProperties.range : 0) > filterProperties.maximum)
		return `${filterProperties.maximum}`;
	else if (number > Number.MAX_SAFE_INTEGER) return `${Number.MAX_SAFE_INTEGER}`;
	return parsingError ? `${number}` : number;
};

/**
 * Transforms a non numeric filter into an array of filter objects if the filter is well formed. If not, return an array containing undefined.
 *
 * @param filter - The non numeric filter.
 * @returns An array with the generated filter objects or undefined.
 */
const processNonNumericFilter = (filter: string, isBpm: boolean): any[] => {
	if (isBpm) return ['180'];
	if (!filter) return [''];
	switch (filter[0]) {
		case 'b':
			switch (filter) {
				case 'b':
					return [new Filter('average', 'maximum', 8)];
				case 'bursts':
					return [new Filter('average', 'maximum', 8)];
				default:
					return ['bursts'];
			}
		case 's':
			switch (filter) {
				case 's':
					return [new Filter('average', 'maximum', 24), new Filter('average', 'minimum', 9)];
				case 'streams':
					return [new Filter('average', 'maximum', 24), new Filter('average', 'minimum', 9)];
				default:
					return ['streams'];
			}
		case 'd':
			switch (filter) {
				case 'd':
					return [new Filter('average', 'minimum', 25)];
				case 'dt':
					return [new Filter('modification', '', true)];
				case 'deathstreams':
					return [new Filter('average', 'minimum', 25)];
				default:
					return ['deathstreams'];
			}
		case 'r':
			switch (filter) {
				case 'r':
					return [new Filter('ranked_status', 'exact', 'ranked')];
				case 'ranked':
					return [new Filter('ranked_status', 'exact', 'ranked')];
				default:
					return ['ranked'];
			}
		case 'u':
			switch (filter) {
				case 'u':
					return [new Filter('ranked_status', 'exact', 'unranked')];
				case 'unranked':
					return [new Filter('ranked_status', 'exact', 'unranked')];
				default:
					return ['unranked'];
			}
		case 'l':
			switch (filter) {
				case 'l':
					return [new Filter('ranked_status', 'exact', 'loved')];
				case 'loved':
					return [new Filter('ranked_status', 'exact', 'loved')];
				default:
					return ['loved'];
			}
		case 'n':
			switch (filter) {
				case 'nomod':
					return [new Filter('modification', '', false)];
				default:
					return ['nomod'];
			}
		default:
			return [''];
	}
};

export default request;
