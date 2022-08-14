import levenary from 'levenary';
import {
	alphanumericFilters,
	AlphanumericParameter,
	Filter,
	numericFilters,
	NumericProperty
} from '../src/models';
import {
	alphanumericGuesses,
	numericGuesses,
	parseRequest,
	typeGuesses
} from '../src/commands/request';

const bpm = numericFilters['bpm'];

const bpmProperty: NumericProperty = 'bpm';
const yearProperty: NumericProperty = 'year';

const numericProperties: NumericProperty[] = [
	'ar',
	'average',
	'bpm',
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

describe('Numeric parameters guessing', () => {
	test('Guess type', () => {
		for (const type of typeGuesses) {
			expect(parseRequest([`${bpm.value}`, `type=${type}`])).toStrictEqual(`${bpm.value} ${type}`);
			expect(parseRequest([`${bpm.value}`, `type=${type}_`])).toStrictEqual(`${bpm.value} ${type}`);
		}
	});

	test('Guess parameter', () => {
		for (const parameter of numericProperties) {
			const { value } = numericFilters[parameter];
			const guess = parameter === bpmProperty ? levenary(parameter, numericGuesses) : parameter;
			expect(parseRequest([`${bpm.value}`, `${parameter}_=${value}`])).toStrictEqual(
				`${bpm.value} ${guess}=${value}`
			);
			expect(parseRequest([`${bpm.value}`, `${parameter}_=${value}-`])).toStrictEqual(
				`${bpm.value} ${guess}=${value}-`
			);
			expect(parseRequest([`${bpm.value}`, `${parameter}_<${value}`])).toStrictEqual(
				`${bpm.value} ${guess}<${value}`
			);
			expect(parseRequest([`${bpm.value}`, `${parameter}_>${value}`])).toStrictEqual(
				`${bpm.value} ${guess}>${value}`
			);
			expect(parseRequest([`${bpm.value}`, `${parameter}_=${value}-${value}`])).toStrictEqual(
				`${bpm.value} ${guess}=${value}-${value}`
			);
		}
	});

	test('Guess value', () => {
		for (const parameter of numericProperties) {
			const { value } = numericFilters[parameter];
			if (parameter === bpmProperty) {
				expect(parseRequest([`${value}_`])).toStrictEqual(`${value}`);
				expect(parseRequest([`${value}_-`])).toStrictEqual(`${value}-`);
				expect(parseRequest([`<${value}_`])).toStrictEqual(`<${value}`);
				expect(parseRequest([`>${value}_`])).toStrictEqual(`>${value}`);
				expect(parseRequest([`${value}_-${value}_`])).toStrictEqual(`${value}-${value}`);
				return;
			}
			expect(parseRequest([`${bpm.value}`, `${parameter}=${value}_`])).toStrictEqual(
				`${bpm.value} ${parameter}=${value}`
			);
			expect(parseRequest([`${bpm.value}`, `${parameter}=${value}_-`])).toStrictEqual(
				`${bpm.value} ${parameter}=${value}-`
			);
			expect(parseRequest([`${bpm.value}`, `${parameter}<${value}_`])).toStrictEqual(
				`${bpm.value} ${parameter}<${value}`
			);
			expect(parseRequest([`${bpm.value}`, `${parameter}>${value}_`])).toStrictEqual(
				`${bpm.value} ${parameter}>${value}`
			);
			expect(parseRequest([`${bpm.value}`, `${parameter}=${value}_-${value}_`])).toStrictEqual(
				`${bpm.value} ${parameter}=${value}-${value}`
			);
		}
	});
});

describe('Numeric parameters parsing', () => {
	test('Parse default value range', () => {
		for (const parameter of numericProperties) {
			const { value, range, property } = numericFilters[parameter];
			const parameters = [`${bpm.value}`];
			if (parameter !== bpmProperty) {
				parameters.push(`${parameter}=${value}`);
			}
			const [filters] = parseRequest(parameters) as [Filter[], boolean];
			if (parameter === yearProperty) {
				expect(filters[filters.length - 2]).toStrictEqual(
					new Filter('minimum', property, new Date(`${value}-01-01T00:00:00+00:00`))
				);
				expect(filters[filters.length - 1]).toStrictEqual(
					new Filter('maximum', property, new Date(`${value}-12-31T23:59:59.999+00:00`))
				);
				return;
			}
			expect(filters[filters.length - 2]).toStrictEqual(
				new Filter('minimum', property, value - range)
			);
			expect(filters[filters.length - 1]).toStrictEqual(
				new Filter('maximum', property, value + range)
			);
		}
	});

	test('Parse exact value', () => {
		for (const parameter of numericProperties) {
			const { value, property } = numericFilters[parameter];
			const parameters = [`${bpm.value}-`];
			if (parameter !== bpmProperty) {
				parameters.push(`${parameter}=${value}-`);
			}
			const [filters] = parseRequest(parameters) as [Filter[], boolean];
			if (parameter === yearProperty) {
				expect(filters[filters.length - 2]).toStrictEqual(
					new Filter('minimum', property, new Date(`${value}-01-01T00:00:00+00:00`))
				);
				expect(filters[filters.length - 1]).toStrictEqual(
					new Filter('maximum', property, new Date(`${value}-12-31T23:59:59.999+00:00`))
				);
				return;
			}
			expect(filters[filters.length - 1]).toStrictEqual(new Filter('exact', property, value));
		}
	});

	test('Parse maximum value', () => {
		for (const parameter of numericProperties) {
			const { value, property } = numericFilters[parameter];
			const parameters = [`<${bpm.value}`];
			if (parameter !== bpmProperty) {
				parameters.push(`${parameter}<${value}`);
			}
			const [filters] = parseRequest(parameters) as [Filter[], boolean];
			if (parameter === yearProperty) {
				expect(filters[filters.length - 1]).toStrictEqual(
					new Filter('maximum', property, new Date(`${value}-12-31T23:59:59.999+00:00`))
				);
				return;
			}
			expect(filters[filters.length - 1]).toStrictEqual(new Filter('maximum', property, value));
		}
	});

	test('Parse minimum value', () => {
		for (const parameter of numericProperties) {
			const { value, property } = numericFilters[parameter];
			const parameters = [`>${bpm.value}`];
			if (parameter !== bpmProperty) {
				parameters.push(`${parameter}>${value}`);
			}
			const [filters] = parseRequest(parameters) as [Filter[], boolean];
			if (parameter === yearProperty) {
				expect(filters[filters.length - 1]).toStrictEqual(
					new Filter('minimum', property, new Date(`${value}-01-01T00:00:00+00:00`))
				);
				return;
			}
			expect(filters[filters.length - 1]).toStrictEqual(new Filter('minimum', property, value));
		}
	});

	test('Parse value range', () => {
		for (const parameter of numericProperties) {
			const { value, range, property } = numericFilters[parameter];
			const parameters = [`${bpm.value - bpm.range}-${bpm.value + bpm.range}`];
			if (parameter !== bpmProperty) {
				parameters.push(`${parameter}=${value - range}-${value + range}`);
			}
			const [filters] = parseRequest(parameters) as [Filter[], boolean];
			if (parameter === yearProperty) {
				expect(filters[filters.length - 2]).toStrictEqual(
					new Filter('minimum', property, new Date(`${value}-01-01T00:00:00+00:00`))
				);
				expect(filters[filters.length - 1]).toStrictEqual(
					new Filter('maximum', property, new Date(`${value}-12-31T23:59:59.999+00:00`))
				);
				return;
			}
			expect(filters[filters.length - 2]).toStrictEqual(
				new Filter('minimum', property, value - range)
			);
			expect(filters[filters.length - 1]).toStrictEqual(
				new Filter('maximum', property, value + range)
			);
		}
	});

	test('Parse value range as extact value', () => {
		for (const parameter of numericProperties) {
			const { value, property } = numericFilters[parameter];
			const parameters = [`${bpm.value}-${bpm.value}`];
			if (parameter !== bpmProperty) {
				parameters.push(`${parameter}=${value}-${value}`);
			}
			const [filters] = parseRequest(parameters) as [Filter[], boolean];
			if (parameter === yearProperty) {
				expect(filters[filters.length - 2]).toStrictEqual(
					new Filter('minimum', property, new Date(`${value}-01-01T00:00:00+00:00`))
				);
				expect(filters[filters.length - 1]).toStrictEqual(
					new Filter('maximum', property, new Date(`${value}-12-31T23:59:59.999+00:00`))
				);
				return;
			}
			expect(filters[filters.length - 1]).toStrictEqual(new Filter('exact', property, value));
		}
	});
});

describe('Alphanumeric parameters guessing', () => {
	test('Guess value', () => {
		for (const parameter of alphanumericGuesses) {
			expect(parseRequest([`${bpm.value}`, `${parameter}_`])).toStrictEqual(
				`${bpm.value} ${parameter}`
			);
		}
	});
});

describe('Alphanumeric parameters parsing', () => {
	test('Parse exact value', () => {
		for (const parameter of alphanumericGuesses) {
			const filter =
				alphanumericFilters[AlphanumericParameter[parameter as keyof typeof AlphanumericParameter]];
			const [filters, useDoubleTime] = parseRequest([`${bpm.value}`, parameter]) as [
				Filter[],
				boolean
			];
			if (typeof filter === 'boolean') {
				expect(useDoubleTime).toStrictEqual(filter);
			} else if (Array.isArray(filter.value)) {
				if (filter.value[0] !== undefined && filter.value[1] !== undefined) {
					expect(filters[filters.length - 2]).toStrictEqual(
						new Filter('minimum', filter.property, filter.value[0])
					);
					expect(filters[filters.length - 1]).toStrictEqual(
						new Filter('maximum', filter.property, filter.value[1])
					);
				} else if (filter.value[1] !== undefined) {
					expect(filters[filters.length - 1]).toStrictEqual(
						new Filter('maximum', filter.property, filter.value[1])
					);
				} else if (filter.value[0] !== undefined) {
					expect(filters[filters.length - 1]).toStrictEqual(
						new Filter('minimum', filter.property, filter.value[0])
					);
				}
			} else {
				expect(filters[filters.length - 1]).toStrictEqual(
					new Filter('exact', filter.property, filter.value)
				);
			}
		}
	});
});
