import {BeatmapRequest, requestBeatmap} from '../../server/logic/bot/beatmaps';
import Filter, {Operator} from '../../server/models/filter';
import Beatmap from '../../server/models/beatmap';
import {BotRequestProperties, filters} from './models';

/**
 * Transforms an array of raw filters into a response object. If not, return a suggested query based on the raw filters.
 *
 * @param rawFilters - The array of raw filters to transform.
 * @returns A promise of the response or suggested query.
 */
const request = async (rawFilters: string[]): Promise<BeatmapRequest | string> => {
	rawFilters = rawFilters.filter(rawFilters => rawFilters != '');
	if (rawFilters.length < 1) return '180';
	const filters: Filter<Beatmap>[] = [];
	const guessedCommand: string[] = [];
	let incorrectFilters = false;
	let isDoubleTime;
	const rawBpm = rawFilters.shift();
	const bpm = rawBpm![0] === '<' || rawBpm![0] === '>' ? `bpm${rawBpm!}` : `bpm=${rawBpm!}`;
	processRawFilter(bpm, true).forEach(parameter => {
		switch (typeof parameter) {
			case 'string':
				guessedCommand.push(parameter);
				incorrectFilters = true;
				break;
			case 'boolean':
				break;
			default:
				filters.push(parameter);
				break;
		}
	});
	if (!incorrectFilters) {
		guessedCommand.push(rawBpm!);
	} else {
		processRawFilter(rawBpm!).forEach(parameter => {
			if (typeof parameter !== 'string') return guessedCommand.push(rawBpm!);
			if (parameter !== '') guessedCommand.push(parameter);
		});
	}
	for (const rawFilter of rawFilters) {
		const processedParameter = processRawFilter(rawFilter);
		let incorrectFilter = false;
		processedParameter.forEach(parameter => {
			switch (typeof parameter) {
				case 'string':
					guessedCommand.push(parameter);
					incorrectFilter = true;
					break;
				case 'boolean':
					isDoubleTime = parameter;
					break;
				default:
					filters.push(parameter);
					break;
			}
		});
		if (!incorrectFilter) guessedCommand.push(rawFilter); else incorrectFilters = true;
	}
	return incorrectFilters ? `${guessedCommand.filter(filter => filter != '').join(' ')}` : await requestBeatmap(isDoubleTime, filters);
};

/**
 * Transforms a raw filter into an array of filter objects if the raw filter is well formed. If not, return an array containing the suggested correct
 * version of the raw filter.
 *
 * @param rawFilter - The raw filter.
 * @returns An array with the generated filter objects or the suggested correct version of the raw filter.
 */
const processRawFilter = (rawFilter: string, isBpm: boolean = false): (Filter<Beatmap> | string | boolean)[] => {
	if (rawFilter.indexOf('=') > 0) {
		let splitIndex = rawFilter.indexOf('=');
		const [isCorrect, name, property] = checkNumericFilterProperty(rawFilter.slice(0, splitIndex));
		if (property === undefined) return processNonNumericFilter(rawFilter, isBpm);
		const values = rawFilter.slice(splitIndex + 1);
		splitIndex = values.indexOf('-');
		if (splitIndex < 0) {
			const value = processRawNumericFilter(values, property, true);
			if (!isCorrect || typeof value === 'string') return isBpm ? [`${value}`] : [`${name}=${value}`];
			return processNumericFilter(property, Operator.minimum, value - filters[property]!.range).
				concat(processNumericFilter(property, Operator.maximum, value + filters[property]!.range));
		} else if (splitIndex === values.length - 1) {
			const value = processRawNumericFilter(values.slice(0, -1), property, true);
			if (!isCorrect || typeof value === 'string') return isBpm ? [`${value}-`] : [`${name}=${value}-`];
			return processNumericFilter(property, Operator.exact, value);
		} else {
			const ranges = values.split('-');
			const minimum = processRawNumericFilter(ranges[0], property, true);
			const maximum = processRawNumericFilter(ranges[1], property, true);
			if (!isCorrect || typeof minimum === 'string' || typeof maximum === 'string') {
				return isBpm ? [`${minimum}-${maximum}`] : [`${name}=${minimum}-${maximum}`];
			}
			return processNumericFilter(property, Operator.minimum, minimum).
				concat(processNumericFilter(property, Operator.maximum, maximum));
		}
	} else if (rawFilter.indexOf('<') > 0) {
		const splitIndex = rawFilter.indexOf('<');
		const [isCorrect, name, property] = checkNumericFilterProperty(rawFilter.slice(0, splitIndex));
		if (property === undefined) return processNonNumericFilter(rawFilter, isBpm);
		const value = processRawNumericFilter(rawFilter.slice(splitIndex + 1), property, true);
		if (!isCorrect || typeof value === 'string') return isBpm ? [`<${value}`] : [`${name}<${value}`];
		return processNumericFilter(property, Operator.maximum, value);
	} else if (rawFilter.indexOf('>') > 0) {
		const splitIndex = rawFilter.indexOf('>');
		const [isCorrect, name, property] = checkNumericFilterProperty(rawFilter.slice(0, splitIndex));
		if (property === undefined) return processNonNumericFilter(rawFilter, isBpm);
		const value = processRawNumericFilter(rawFilter.slice(splitIndex + 1), property, true);
		if (!isCorrect || typeof value === 'string') return isBpm ? [`>${value}`] : [`${name}>${value}`];
		return processNumericFilter(property, Operator.minimum, value);
	}
	return processNonNumericFilter(rawFilter, isBpm);
};

/**
 * Transforms a numeric filter into an array of filter objects.
 *
 * @param property - The name of the numeric filter's target property.
 * @param value - The value of the numeric filter.
 * @param format - The type of the numeric filter to generate with the filter's value ('exact', minimum or maximum).
 * @returns An array with the generated filter objects.
 */
const processNumericFilter = (property: (keyof Beatmap), format: Operator, value: number): Filter<Beatmap>[] => {
	switch (format) {
		case Operator.exact:
			return property === 'last_updated' ?
				[new Filter(property, Operator.minimum, `${value}-01-01 00:00:00`), new Filter(property, Operator.maximum, `${value}-12-31 23:59:59`)] :
				[new Filter(property, format, value)];
		case Operator.minimum:
			return [new Filter(property, format, property === 'last_updated' ? `${value}-01-01 00:00:00` : value)];
		case Operator.maximum:
			return [new Filter(property, format, property === 'last_updated' ? `${value}-12-31 23:59:59` : value)];
		default:
			return [];
	}
};

/**
 * Checks if the name for the numeric filter's target property is correct and guesses the correct name if the name is incorrect.
 *
 * @param name - The property name of the numeric filter's target property.
 * @returns An array with a boolean indicating if the name is correct in the first position
 * and a string with the guessed correct name in the second position.
 */
const checkNumericFilterProperty = (property: string): [boolean, BotRequestProperties | '', (keyof Beatmap) | undefined] => {
	switch (property[0]) {
		case BotRequestProperties.ar[0]:
			return property === BotRequestProperties.ar ? [true, BotRequestProperties.ar, 'ar'] :
				[property === BotRequestProperties.average, BotRequestProperties.average, 'stream_length'];
		case BotRequestProperties.bpm[0]:
			return [property === BotRequestProperties.bpm, BotRequestProperties.bpm, 'bpm'];
		case BotRequestProperties.cs[0]:
			return [property === BotRequestProperties.cs, BotRequestProperties.cs, 'cs'];
		case BotRequestProperties.density[0]:
			return [property === BotRequestProperties.density, BotRequestProperties.density, 'stream_density'];
		case BotRequestProperties.length[0]:
			return [property === BotRequestProperties.length, BotRequestProperties.length, 'hit_length'];
		case BotRequestProperties.od[0]:
			return [property === BotRequestProperties.od, BotRequestProperties.od, 'accuracy'];
		case BotRequestProperties.stars[0]:
			return [property === BotRequestProperties.stars, BotRequestProperties.stars, 'difficulty_rating'];
		case BotRequestProperties.year[0]:
			return [property === BotRequestProperties.year, BotRequestProperties.year, 'last_updated'];
		default:
			return [false, '', undefined];
	}
};

/**
 * Transforms a number from a numeric filter value into its corresponding number representation or an string of the guessed correct number.
 *
 * @param rawNumber - The number from the numeric filter value.
 * @param property - The property name of the numeric filter's target property.
 * @param useDefaultRange - The indicator of wether or not to use to take into account the default ranges for the filter.
 * @returns A number representing the raw number or an string of the guessed correct number.
 */
const processRawNumericFilter = (rawNumber: string | number, property: (keyof Beatmap), useDefaultRange: boolean = false): number | string => {
	if (typeof rawNumber === 'number') return rawNumber;
	const {defaultValue, range, minimum, maximum} = filters[property]!;
	let number = Number(rawNumber);
	let parsingError = false;
	if (isNaN(number)) {
		number = parseFloat(rawNumber);
		if (isNaN(number)) return `${defaultValue}`;
		parsingError = true;
	}
	if (number + (useDefaultRange ? range : 0) < minimum) return `${minimum}`;
	if (maximum !== undefined && number - (useDefaultRange ? range : 0) > maximum) {
		return `${maximum}`;
	} else if (number > Number.MAX_SAFE_INTEGER) {
		return `${Number.MAX_SAFE_INTEGER}`;
	}
	return parsingError ? `${number}` : number;
};

/**
 * Transforms a non numeric filter into an array of filter objects if the filter is well formed. If not, return an array an string with the guessed
 * correct filter.
 *
 * @param filter - The non numeric filter.
 * @returns An array with the generated filter objects or an array with an string with the guessed correct filter.
 */
const processNonNumericFilter = (filter: string, isBpm: boolean): (Filter<Beatmap> | string | boolean)[] => {
	if (isBpm) return ['180'];
	switch (filter[0]) {
		case 'b':
			return filter === 'b' || filter === 'bursts' ? [new Filter<Beatmap>('stream_length', Operator.maximum, 8)] : ['bursts'];
		case 's':
			return filter === 's' || filter === 'streams' ?
				[new Filter<Beatmap>('stream_length', Operator.maximum, 24), new Filter<Beatmap>('stream_length', Operator.minimum, 9)] : ['streams'];
		case 'd':
			if (filter === 'd' || filter === 'deathstreams') return [new Filter<Beatmap>('stream_length', Operator.minimum, 25)];
			return filter === 'dt' ? [true] : ['deathstreams'];
		case 'r':
			return filter === 'r' || filter === 'ranked' ? [new Filter<Beatmap>('ranked', Operator.exact, 'ranked')] : ['ranked'];
		case 'u':
			return filter === 'u' || filter === 'unranked' ? [new Filter<Beatmap>('ranked', Operator.exact, 'unranked')] : ['unranked'];
		case 'l':
			return filter === 'l' || filter === 'loved' ? [new Filter<Beatmap>('ranked', Operator.exact, 'loved')] : ['loved'];
		case 'n':
			return filter === 'nomod' ? [false] : ['nomod'];
		case 't':
			const typeFilter = filter.split('=');
			if (typeFilter.length > 1) {
				switch (typeFilter[1][0]) {
					case 'b':
						return ['bursts'];
					case 'd':
						return ['deathstreams'];
					default:
						return ['streams'];
				}
			}
			return [''];
		default:
			return [''];
	}
};

export default request;
