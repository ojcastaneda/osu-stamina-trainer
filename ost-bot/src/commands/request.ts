import levenary from 'levenary';
import {
	alphanumericFilters,
	AlphanumericParameter,
	Beatmap,
	Filter,
	Modification,
	NumericFilter,
	numericFilters,
	NumericProperty,
	Operator
} from '../models';

export type ModificationIndicator = '' | ' +DT |';

/**
 * Guesses for properties of numeric filters.
 */
export const numericGuesses: NumericProperty[] = [
	'ar',
	'average',
	'cs',
	'density',
	'length',
	'longest',
	'od',
	'pp',
	'pp95',
	'spacing',
	'stars',
	'year'
];

/**
 * Guesses for parameters of alphanumeric filters.
 */
export const alphanumericGuesses = Object.values(AlphanumericParameter).filter(
	(key) => typeof key === 'string' && key.length > 1
) as string[];

/**
 * Guesses for legacy parameters.
 */
export const typeGuesses: (keyof typeof AlphanumericParameter)[] = [
	'bursts',
	'deathstreams',
	'streams'
];

/**
 * Returns the i18n properties for `request` if a beatmap that meets the provided filters and modification.
 * Otherwise, returns the i18n property for `request not found`.
 *
 * @param alreadyRequested - The indicator of whether or not it should warn the user that the beatmaps
 * will repeat until the cache session expires.
 * @param filters - The filters used for the request.
 * @param useDoubleTime - Whether or not to request a beatmap based on its double time statistics.
 * @returns The corresponding i18n properties.
 */
async function fetchRequest(
	alreadyRequested: boolean,
	filters: Filter[],
	useDoubleTime: boolean
): Promise<'requestNotFound' | ['beatmapInformation', Beatmap, ModificationIndicator, boolean]> {
	const response = await fetch(
		`${process.env.API_URL}/api/bot/beatmap/request?use_double_time=${useDoubleTime}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(filters)
		}
	);

	return response.status === 404
		? 'requestNotFound'
		: [
				'beatmapInformation',
				await response.json(),
				useDoubleTime ? ' +DT |' : '',
				alreadyRequested
		  ];
}

/**
 * If the command is correct and the guess command parameter is set to true,
 * returns the provided command from the user into an array of filters and an indicator for which modification to use.
 * Otherwise, returns a guess for the provided command.
 *
 * @param parameters - The filters provided by the user.
 * @param guessCommand - Whether or not to guess the command even if it is correct.
 * @returns The parsed or guessed command.
 */
export function parseRequest(
	parameters: string[],
	guessCommand = false
): [Filter[], Modification] | string {
	if (parameters.length < 1) return `${numericFilters['bpm'].value}`;
	let filters: Filter[] = [];
	const guessedCommand: string[] = [];
	let incorrectFilters = false;
	let useDoubleTime = Modification.NoMod;
	parameters[0] =
		parameters[0][0] === '<' || parameters[0][0] === '>'
			? `bpm${parameters[0]}`
			: `bpm=${parameters[0]}`;
	for (const parameter of parameters) {
		const filter = parseParameter(parameter);
		const concatGuess = (newGuess: string) =>
			guessedCommand.find((guess) => newGuess === guess) === undefined;
		switch (typeof filter) {
			case 'string':
				if (concatGuess(filter)) guessedCommand.push(filter);
				incorrectFilters = true;
				break;
			case 'number':
				if (concatGuess(parameter)) guessedCommand.push(parameter);
				useDoubleTime = filter;
				break;
			default:
				if (concatGuess(parameter)) guessedCommand.push(parameter);
				filters = filters.concat(filter);
				break;
		}
	}
	guessedCommand[0] = guessedCommand[0].slice(
		guessedCommand[0][3] === '<' || guessedCommand[0][3] === '>' ? 3 : 4
	);
	return incorrectFilters || guessCommand ? guessedCommand.join(' ') : [filters, useDoubleTime];
}

/**
 * If the parameter is correct, returns an array of filters or a boolean based on the parameter.
 * Otherwise, returns a guess for the parameter.
 *
 * @param parameter - The parameter to parse.
 * @returns The parsed or guessed parameter.
 */
function parseParameter(parameter: string): Filter[] | string | Modification {
	let splitIndex = parameter.indexOf('=');
	if (splitIndex > 0) {
		const numericProperty = parameter.slice(0, splitIndex);
		if (numericProperty === 'type') return levenary(parameter.slice(splitIndex + 1), typeGuesses);
		const [property, numericFilter, isCorrect] = parseNumericProperty(numericProperty);

		let value = parameter.slice(splitIndex + 1);
		splitIndex = value.indexOf('-');
		if (splitIndex < 0) {
			const parsedValue = parseNumericParameter(numericFilter, 'minimum', value, true);
			return !isCorrect || typeof parsedValue === 'number'
				? `${property}=${typeof parsedValue === 'number' ? parsedValue : value}`
				: parsedValue.concat(
						parseNumericParameter(numericFilter, 'maximum', value, true) as Filter[]
				  );
		}
		if (splitIndex !== value.length - 1) {
			const maximumValue = value.slice(splitIndex + 1);
			const maximum = parseNumericParameter(numericFilter, 'maximum', maximumValue);
			const minimumValue = value.slice(0, splitIndex);
			const minimum = parseNumericParameter(numericFilter, 'minimum', minimumValue);
			if (!isCorrect || typeof maximum === 'number' || typeof minimum === 'number') {
				return `${property}=${typeof minimum === 'number' ? minimum : minimumValue}-${
					typeof maximum === 'number' ? maximum : maximumValue
				}`;
			}
			if (maximum[0].value !== minimum[0].value) {
				return minimum.concat(maximum);
			}
			value = maximumValue;
		} else {
			value = value.slice(0, -1);
		}
		const parsedValue = parseNumericParameter(numericFilter, 'exact', value);
		return !isCorrect || typeof parsedValue === 'number'
			? `${property}=${typeof parsedValue === 'number' ? parsedValue : value}-`
			: parsedValue;
	}
	splitIndex = parameter.indexOf('<');
	if (splitIndex > 0) {
		const [property, numericFilter, isCorrect] = parseNumericProperty(
			parameter.slice(0, splitIndex)
		);
		const value = parameter.slice(splitIndex + 1);
		const parsedValue = parseNumericParameter(numericFilter, 'maximum', value);
		return !isCorrect || typeof parsedValue === 'number'
			? `${property}<${typeof parsedValue === 'number' ? parsedValue : value}`
			: parsedValue;
	}
	splitIndex = parameter.indexOf('>');
	if (splitIndex > 0) {
		const [property, numericFilter, isCorrect] = parseNumericProperty(
			parameter.slice(0, splitIndex)
		);
		const value = parameter.slice(splitIndex + 1);
		const parsedValue = parseNumericParameter(numericFilter, 'minimum', value);
		return !isCorrect || typeof parsedValue === 'number'
			? `${property}>${typeof parsedValue === 'number' ? parsedValue : value}`
			: parsedValue;
	}
	return parseAlphanumericParameter(parameter);
}

/**
 * Returns a numeric property from a parameter into an array of the guessed property,
 * the filter representation of the property,
 * and whether or not the property was incorrect and had to be guessed.
 *
 * @param property - The numeric property from the parameter.
 * @returns The array containing the parsing result.
 */
function parseNumericProperty(property: string): [string, NumericFilter, boolean] {
	const numericFilter = numericFilters[property as NumericProperty];
	if (numericFilter === undefined) {
		const guessedProperty = levenary(property, numericGuesses);
		return [guessedProperty, numericFilters[guessedProperty as NumericProperty], false];
	}
	return [property, numericFilter, true];
}

/**
 * If the numeric parameter is correct, returns an array of filters based on the parameter.
 * Otherwise, returns a guess for the parameter.
 *
 * @param numericFilter - The numeric filter of the parameter.
 * @param format - The operator to use for the parsed filters.
 * @param value - The value of the numeric parameter.
 * @param applyRange - Whether or not to use the default range of the parameter.
 * @returns The parsed or guessed numeric parameter.
 */
function parseNumericParameter(
	numericFilter: NumericFilter,
	format: Operator,
	value: string,
	applyRange = false
): Filter[] | number {
	if (value === '') return numericFilter.value;
	let parsedValue = Number(value);
	if (isNaN(parsedValue)) {
		parsedValue = parseFloat(value);
		return isNaN(parsedValue) ? numericFilter.value : parsedValue;
	}
	switch (format) {
		case 'maximum':
			if (applyRange) parsedValue += numericFilter.range;
			break;
		case 'minimum':
			if (applyRange) parsedValue -= numericFilter.range;
			break;
		case 'exact':
			return numericFilter.property === 'last_updated'
				? [parseYear('minimum', parsedValue), parseYear('maximum', parsedValue)]
				: [new Filter(format, numericFilter.property, parsedValue)];
	}
	return [
		numericFilter.property === 'last_updated'
			? parseYear(format, parsedValue)
			: new Filter(format, numericFilter.property, parsedValue)
	];
}

/**
 * Returns the filter based on the year of the date when a beatmap was last updated.
 *
 * @param operator - The operator to use for the parsed filters.
 * @param value - The year to filter.
 * @returns The parsed date.
 */
export function parseYear(operator: 'maximum' | 'minimum', value: number): Filter {
	return operator === 'maximum'
		? new Filter(operator, 'last_updated', new Date(`${value}-12-31T23:59:59.999+00:00`))
		: new Filter(operator, 'last_updated', new Date(`${value}-01-01T00:00:00+00:00`));
}

/**
 * If the alphanumeric parameter is correct, returns an array of filters based on the parameter.
 * Otherwise, returns a guess for the parameter.
 *
 * @param parameter - The alphanumeric parameter to parse.
 * @returns The parsed or guessed alphanumeric parameter.
 */
function parseAlphanumericParameter(parameter: string): Filter[] | string | Modification {
	const alphanumericFilter =
		alphanumericFilters[AlphanumericParameter[parameter as keyof typeof AlphanumericParameter]];
	switch (typeof alphanumericFilter) {
		case 'number':
			return alphanumericFilter;
		case 'object': {
			const filters: Filter[] = [];
			if (!Array.isArray(alphanumericFilter.value)) {
				return [new Filter('exact', alphanumericFilter.property, alphanumericFilter.value)];
			}
			if (alphanumericFilter.value[0] !== undefined) {
				filters.push(
					new Filter('minimum', alphanumericFilter.property, alphanumericFilter.value[0])
				);
			}
			if (alphanumericFilter.value[1] !== undefined) {
				filters.push(
					new Filter('maximum', alphanumericFilter.property, alphanumericFilter.value[1])
				);
			}
			return filters;
		}
		default:
			return levenary(parameter, alphanumericGuesses);
	}
}

/**
 * Returns the i18n properties for `request` if a beatmap that meets the provided filters and the command is correct.
 * If the command is incorrect guesses the correct command, and returns the i18n properties for `did you mean`.
 * Otherwise, returns the i18n property for `request not found`.
 *
 * @param command - The command used `!r` or `!request`.
 * @param parameters - The parameters to filter the request.
 * @param skippedIds - The list of temporarily blacklisted requests.
 * @param guessCommand - Whether or not to guess the command even if it is correct.
 * @returns The corresponding i18n properties.
 */
export async function request(
	command: string,
	parameters: string[],
	skippedIds: number[],
	guessCommand = false
): Promise<
	| 'requestNotFound'
	| ['beatmapInformation', Beatmap, ModificationIndicator, boolean]
	| ['didYouMean', string]
> {
	const parsedRequest = parseRequest(parameters, guessCommand);
	if (typeof parsedRequest === 'string') return ['didYouMean', `${command} ${parsedRequest}`];
	const filters =
		skippedIds.length > 0
			? [new Filter('different', 'id', skippedIds)].concat(parsedRequest[0])
			: parsedRequest[0];
	if (parsedRequest[1] !== Modification.FreeMod) {
		const useDoubleTime = parsedRequest[1] === Modification.DoubleTime;
		const request = await fetchRequest(false, filters, useDoubleTime);
		return request === 'requestNotFound' && skippedIds.length > 0
			? fetchRequest(true, parsedRequest[0], useDoubleTime)
			: request;
	}
	const useDoubleTime = Math.random() < 0.5;
	let request = await fetchRequest(false, filters, useDoubleTime);
	if (request !== 'requestNotFound') return request;
	request = await fetchRequest(false, filters, !useDoubleTime);
	if (request !== 'requestNotFound') return request;
	request = await fetchRequest(true, parsedRequest[0], useDoubleTime);
	return request === 'requestNotFound' && skippedIds.length > 0
		? fetchRequest(true, parsedRequest[0], !useDoubleTime)
		: request;
}
