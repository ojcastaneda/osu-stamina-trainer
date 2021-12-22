import { requestBeatmap } from '../server/logic/bot/beatmaps.logic';
import Beatmap from '../server/models/beatmap';
import Filter from '../server/models/filter';

/**
 * The default values, ranges and limits of the numeric filters.
 */
import filtersProperties from './filtersProperties.json';

/**
 * Transforms an array of raw filters into a response object. If not, return a suggested query based on the raw filters.
 *
 * @param rawFilters - The array of raw filters to transform.
 * @returns A promise of the response or suggested query.
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
	else {
		processRawFilter(rawBpm!).forEach(parameter => {
			if (typeof parameter !== 'string') return guessedCommand.push(rawBpm!);
			if (parameter !== '') guessedCommand.push(parameter);
		});
	}
	for (const rawFilter of rawFilters) {
		const processedParameter = processRawFilter(rawFilter);
		let incorrectFilter = false;
		processedParameter.forEach(parameter => {
			if (typeof parameter !== 'string') {
				if (parameter.filterProperty !== 'modification') return filters.push(parameter);
				return (isDoubleTime = parameter.value);
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
 * Transforms a raw filter into an array of filter objects if the raw filter is well formed. If not, return an array containing the suggested correct version of the raw filter.
 *
 * @param rawFilter - The raw filter.
 * @returns An array with the generated filter objects or the suggested correct version of the raw filter.
 */
const processRawFilter = (rawFilter: string, isBpm: boolean = false): any[] => {
	if (rawFilter.indexOf('=') > 0) {
		let splitIndex = rawFilter.indexOf('=');
		const [isCorrect, name] = checkNumericFilterProperty(rawFilter.slice(0, splitIndex));
		if (name === '') return processNonNumericFilter(rawFilter, isBpm);
		const values = rawFilter.slice(splitIndex + 1);
		splitIndex = values.indexOf('-');
		if (splitIndex < 0) {
			const value = processRawNumericFilter(values, name, true);
			if (!isCorrect || typeof value === 'string') return isBpm ? [`${value}`] : [`${name}=${value}`];
			// @ts-ignore
			const { range } = filtersProperties[name];
			return processNumericFilter(name, value - range, 'minimum').concat(processNumericFilter(name, value + range, 'maximum'));
		} else if (splitIndex === values.length - 1) {
			const value = processRawNumericFilter(values.slice(0, -1), name, true);
			if (!isCorrect || typeof value === 'string') return isBpm ? [`${value}-`] : [`${name}=${value}-`];
			return processNumericFilter(name, value, 'exact');
		} else {
			const ranges = values.split('-');
			const minimum = processRawNumericFilter(ranges[0], name, true);
			const maximum = processRawNumericFilter(ranges[1], name, true);
			if (!isCorrect || typeof minimum === 'string' || typeof maximum === 'string')
				return isBpm ? [`${minimum}-${maximum}`] : [`${name}=${minimum}-${maximum}`];
			return processNumericFilter(name, minimum, 'minimum').concat(processNumericFilter(name, maximum, 'maximum'));
		}
	} else if (rawFilter.indexOf('<') > 0) {
		const splitIndex = rawFilter.indexOf('<');
		const [isCorrect, name] = checkNumericFilterProperty(rawFilter.slice(0, splitIndex));
		if (name === '') return processNonNumericFilter(rawFilter, isBpm);
		const value = processRawNumericFilter(rawFilter.slice(splitIndex + 1), name, true);
		if (!isCorrect || typeof value === 'string') return isBpm ? [`<${value}`] : [`${name}<${value}`];
		return processNumericFilter(name, value, 'maximum');
	} else if (rawFilter.indexOf('>') > 0) {
		const splitIndex = rawFilter.indexOf('>');
		const [isCorrect, name] = checkNumericFilterProperty(rawFilter.slice(0, splitIndex));
		if (name === '') return processNonNumericFilter(rawFilter, isBpm);
		const value = processRawNumericFilter(rawFilter.slice(splitIndex + 1), name, true);
		if (!isCorrect || typeof value === 'string') return isBpm ? [`>${value}`] : [`${name}>${value}`];
		return processNumericFilter(name, value, 'minimum');
	}
	return processNonNumericFilter(rawFilter, isBpm);
};

/**
 * Transforms a numeric filter into an array of filter objects.
 *
 * @param name - The name of the numeric filter's target property.
 * @param value - The value of the numeric filter.
 * @param format - The type of the numeric filter to generate with the filter's value ('exact', 'minimum' or 'maximum').
 * @returns An array with the generated filter objects.
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

/**
 * Checks if the name for the numeric filter's target property is correct and guesses the correct name if the name is incorrect.
 *
 * @param name - The property name of the numeric filter's target property.
 * @returns An array with a boolean indicating if the name is correct in the first position
 * and an string with the guessed correct name in the second position.
 */
const checkNumericFilterProperty = (name: string): [boolean, string] => {
	switch (name[0]) {
		case 'a':
			return name === 'ar' ? [true, 'ar'] : [name === 'average', 'average'];
		case 'b':
			return [name === 'bpm', 'bpm'];
		case 'c':
			return [name === 'cs', 'cs'];
		case 'd':
			return [name === 'density', 'density'];
		case 'l':
			return [name === 'length', 'length'];
		case 'o':
			return [name === 'od', 'od'];
		case 's':
			return [name === 'stars', 'stars'];
		case 'y':
			return [name === 'year', 'year'];
		default:
			return [false, ''];
	}
};

/**
 * Transforms a number from a numeric filter value into its corresponding number representation or an string of the guessed correct number.
 *
 * @param rawNumber - The number from the numeric filter value.
 * @param name - The property name of the numeric filter's target property.
 * @param useDefaultRange - The indicator of wether or not to use to take into account the default ranges for the filter.
 * @returns A number representing the raw number or an string of the guessed correct number.
 */
const processRawNumericFilter = (rawNumber: string | number, name: string, useDefaultRange: boolean = false): number | string => {
	if (typeof rawNumber === 'number') return rawNumber;
	// @ts-ignore
	const { defaultValue, range, minimum, maximum } = filtersProperties[name];
	let number = Number(rawNumber);
	let parsingError = false;
	if (isNaN(number)) {
		number = parseFloat(rawNumber);
		if (isNaN(number)) return `${defaultValue}`;
		parsingError = true;
	}
	if (number + (useDefaultRange ? range : 0) < minimum) return `${minimum}`;
	if (maximum !== undefined && number - (useDefaultRange ? range : 0) > maximum) return `${maximum}`;
	else if (number > Number.MAX_SAFE_INTEGER) return `${Number.MAX_SAFE_INTEGER}`;
	return parsingError ? `${number}` : number;
};

/**
 * Transforms a non numeric filter into an array of filter objects if the filter is well formed. If not, return an array an string with the guessed correct filter.
 *
 * @param filter - The non numeric filter.
 * @returns An array with the generated filter objects or an array with an string with the guessed correct filter.
 */
const processNonNumericFilter = (filter: string, isBpm: boolean): any[] => {
	if (isBpm) return ['180'];
	switch (filter[0]) {
		case 'b':
			return filter === 'b' || filter === 'bursts' ? [new Filter('average', 'maximum', 8)] : ['bursts'];
		case 's':
			return filter === 's' || filter === 'streams' ? [new Filter('average', 'maximum', 24), new Filter('average', 'minimum', 9)] : ['streams'];
		case 'd':
			if (filter === 'd' || filter === 'deathstreams') return [new Filter('average', 'minimum', 25)];
			return filter === 'dt' ? [new Filter('modification', '', true)] : ['deathstreams'];
		case 'r':
			return filter === 'r' || filter === 'ranked' ? [new Filter('ranked_status', 'exact', 'ranked')] : ['ranked'];
		case 'u':
			return filter === 'u' || filter === 'unranked' ? [new Filter('ranked_status', 'exact', 'unranked')] : ['unranked'];
		case 'l':
			return filter === 'l' || filter === 'loved' ? [new Filter('ranked_status', 'exact', 'loved')] : ['loved'];
		case 'n':
			return filter === 'nomod' ? [new Filter('modification', '', false)] : ['nomod'];
		default:
			return [''];
	}
};

export default request;
