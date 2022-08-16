import levenary from 'levenary';
import { I18nProps } from '../i18n';
import {
	alphanumericFilters,
	AlphanumericParameter,
	Beatmap,
	Filter,
	NumericFilter,
	numericFilters,
	NumericProperty,
	Operator
} from '../models';

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

export const alphanumericGuesses = Object.values(AlphanumericParameter).filter(
	(key) => typeof key === 'string'
) as string[];

export const typeGuesses = Object.values(AlphanumericParameter).filter((key) => {
	if (typeof key === 'number') return false;
	switch (AlphanumericParameter[key as keyof typeof AlphanumericParameter]) {
		case AlphanumericParameter.bursts:
		case AlphanumericParameter.deathstreams:
		case AlphanumericParameter.streams:
			return true;
		default:
			return false;
	}
}) as string[];

async function fetchRequest(
	filters: Filter[],
	useDoubleTime: boolean
): Promise<Beatmap | undefined> {
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
	if (response.status === 404) return undefined;
	return response.json();
}

export function parseRequest(
	parameters: string[],
	guessCommand = false
): [Filter[], boolean | undefined] | string {
	if (parameters.length < 1) return `${numericFilters['bpm'].value}`;
	let filters: Filter[] = [];
	const guessedCommand: string[] = [];
	let incorrectFilters = false;
	let useDoubleTime;
	parameters[0] =
		parameters[0][0] === '<' || parameters[0][0] === '>'
			? `bpm${parameters[0]}`
			: `bpm=${parameters[0]}`;
	for (const parameter of parameters) {
		const filter = parseParameter(parameter);
		switch (typeof filter) {
			case 'string':
				guessedCommand.push(filter);
				incorrectFilters = true;
				break;
			case 'boolean':
				guessedCommand.push(parameter);
				useDoubleTime = filter;
				break;
			default:
				guessedCommand.push(parameter);
				filters = filters.concat(filter);
				break;
		}
	}
	guessedCommand[0] = guessedCommand[0].slice(
		guessedCommand[0][3] === '<' || guessedCommand[0][3] === '>' ? 3 : 4
	);
	return incorrectFilters || guessCommand ? guessedCommand.join(' ') : [filters, useDoubleTime];
}

function parseParameter(parameter: string): Filter[] | string | boolean {
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
				return `${property}=${typeof minimum === 'number' ? minimum : maximumValue}-${
					typeof maximum === 'number' ? maximum : minimumValue
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

function parseNumericProperty(property: string): [string, NumericFilter, boolean] {
	const numericFilter = numericFilters[property as NumericProperty];
	if (numericFilter === undefined) {
		const guessedProperty = levenary(property, numericGuesses);
		return [guessedProperty, numericFilters[guessedProperty as NumericProperty], false];
	}
	return [property, numericFilter, true];
}

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

function parseYear(operator: 'maximum' | 'minimum', value: number): Filter {
	return operator === 'maximum'
		? new Filter(operator, 'last_updated', new Date(`${value}-12-31T23:59:59.999+00:00`))
		: new Filter(operator, 'last_updated', new Date(`${value}-01-01T00:00:00+00:00`));
}

function parseAlphanumericParameter(parameter: string): Filter[] | string | boolean {
	const alphanumericFilter =
		alphanumericFilters[AlphanumericParameter[parameter as keyof typeof AlphanumericParameter]];
	switch (typeof alphanumericFilter) {
		case 'boolean':
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

export async function request(
	command: string,
	parameters: string[],
	guessCommand = false
): Promise<I18nProps> {
	const parsedRequest = parseRequest(parameters, guessCommand);
	if (typeof parsedRequest === 'string') return ['didYouMean', `${command} ${parsedRequest}`];
	console.info(`${command} ${parameters} | DT: ${parsedRequest[0]} | Filters: ${parsedRequest[1]}`);
	if (parsedRequest[1] !== undefined) {
		const beatmap = await fetchRequest(parsedRequest[0], parsedRequest[1]);
		return beatmap === undefined
			? 'requestNotFound'
			: ['request', beatmap, parsedRequest[1] ? ' +DT |' : ''];
	}
	const useDoubleTime = parsedRequest[1] === undefined ? Math.random() >= 0.5 : parsedRequest[1];
	let beatmap = await fetchRequest(parsedRequest[0], useDoubleTime);
	if (beatmap === undefined) {
		beatmap = await fetchRequest(parsedRequest[0], !useDoubleTime);
		return beatmap === undefined
			? 'requestNotFound'
			: ['request', beatmap, !useDoubleTime ? ' +DT |' : ''];
	}
	return ['request', beatmap, useDoubleTime ? ' +DT |' : ''];
}
