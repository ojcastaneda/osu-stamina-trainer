import { Assertion, botTest, expectedTestBeatmap, mockFetch, testBeatmap } from '../setup';
import {
	alphanumericGuesses,
	numericGuesses,
	parseYear,
	typeGuesses
} from '../../src/commands/request';
import {
	alphanumericFilters,
	AlphanumericParameter,
	Filter,
	Modification,
	numericFilters,
	NumericProperty
} from '../../src/models';

const bpm = testBeatmap.bpm;

const defaultFilters = [
	new Filter('minimum', 'bpm', bpm - numericFilters.bpm.range),
	new Filter('maximum', 'bpm', bpm + numericFilters.bpm.range)
];

const numericProperties = numericGuesses.concat('bpm');

function expectRequest<T>(body: T, useDoubleTime = false) {
	expect(fetch).toBeCalledWith(
		`${process.env.API_URL}/api/bot/beatmap/request?use_double_time=${useDoubleTime}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}
	);
}

function formatRequest(
	property: NumericProperty,
	scenario: '=' | '<' | '>',
	...values: (string | number)[]
): string {
	return `${
		property === 'bpm'
			? `!r ${scenario === '=' ? '' : scenario}`
			: `!r ${bpm} ${property}${scenario}`
	}${values.join('')}`;
}

botTest(
	{
		assertions: typeGuesses.map(
			(type) => new Assertion(['didYouMean', `!r ${bpm} ${type}`], `!r ${bpm} type=${type}`)
		),
		description: 'Reply to beatmap request command using deprecated "type" filter'
	},
	(handleMessage) => handleMessage()
);

botTest(
	{
		assertions: numericGuesses
			.map((property) => {
				const value = numericFilters[property].value;
				return [
					new Assertion(
						['didYouMean', `!r ${bpm} ${property}=${value}`],
						`!r ${bpm} ${property}_=${value} ${property}=${value}`
					),
					new Assertion(
						['didYouMean', `!r ${bpm} ${property}=${value}`],
						`!r ${bpm} ${property}=${value}_ ${property}=${value}`
					),
					new Assertion(
						['didYouMean', `!r ${bpm} ${property}=${value}`],
						`!r ${bpm} ${property}=${value}_ ${property}=${value}_`
					)
				];
			})
			.concat(
				alphanumericGuesses.map(
					(guess) =>
						new Assertion(['didYouMean', `!r ${bpm} ${guess}`], `!r ${bpm} ${guess}_ ${guess}`)
				)
			)
			.flat(),
		description: 'Reply to beatmap request command guessing incorrect repeated properties'
	},
	(handleMessage) => handleMessage()
);

botTest(
	{
		assertions: numericGuesses
			.map((property) => {
				const value = numericFilters[property].value;
				return [
					new Assertion(
						['didYouMean', `!r ${bpm} ${property}=${value}`],
						`!r ${bpm} ${property}_=${value}`
					),
					new Assertion(
						['didYouMean', `!r ${bpm} ${property}=${value}-`],
						`!r ${bpm} ${property}_=${value}-`
					),
					new Assertion(
						['didYouMean', `!r ${bpm} ${property}<${value}`],
						`!r ${bpm} ${property}_<${value}`
					),
					new Assertion(
						['didYouMean', `!r ${bpm} ${property}>${value}`],
						`!r ${bpm} ${property}_>${value}`
					),
					new Assertion(
						['didYouMean', `!r ${bpm} ${property}=${value}-${value}`],
						`!r ${bpm} ${property}_=${value}-${value}`
					)
				];
			})
			.flat(),
		description: 'Reply to beatmap request command guessing incorrect numeric property'
	},
	(handleMessage) => handleMessage()
);

botTest(
	{
		assertions: numericProperties
			.map((property) => {
				const value = numericFilters[property].value;
				const input = value + 1;
				return [
					new Assertion(
						['didYouMean', formatRequest(property, '=', input)],
						formatRequest(property, '=', input, '_')
					),
					new Assertion(
						['didYouMean', formatRequest(property, '=', value)],
						formatRequest(property, '=', 'incorrect')
					),
					new Assertion(
						['didYouMean', formatRequest(property, '=', input, '-')],
						formatRequest(property, '=', input, '_-')
					),
					new Assertion(
						['didYouMean', formatRequest(property, '=', value, '-')],
						formatRequest(property, '=', 'incorrect-')
					),
					new Assertion(
						['didYouMean', formatRequest(property, '<', input)],
						formatRequest(property, '<', input, '_')
					),
					new Assertion(
						['didYouMean', formatRequest(property, '<', value)],
						formatRequest(property, '<', 'incorrect')
					),
					new Assertion(
						['didYouMean', formatRequest(property, '>', input)],
						formatRequest(property, '>', input, '_')
					),
					new Assertion(
						['didYouMean', formatRequest(property, '>', value)],
						formatRequest(property, '>', 'incorrect')
					),
					new Assertion(
						['didYouMean', formatRequest(property, '=', input, '-', input)],
						formatRequest(property, '=', input, '_-', input, '_')
					),
					new Assertion(
						['didYouMean', formatRequest(property, '=', value, '-', value)],
						formatRequest(property, '=', 'incorrect-incorrect')
					)
				];
			})
			.flat(),
		description: 'Reply to beatmap request command guessing incorrect numeric value'
	},
	(handleMessage) => handleMessage()
);

botTest<Filter[]>(
	{
		assertions: numericProperties
			.map((numericProperty) => {
				const { property, range, value } = numericFilters[numericProperty];
				const filters = numericProperty === 'bpm' ? [] : defaultFilters;
				return [
					new Assertion(
						expectedTestBeatmap,
						formatRequest(numericProperty, '=', value),
						filters.concat(
							numericProperty === 'year'
								? [parseYear('minimum', value), parseYear('maximum', value)]
								: [
										new Filter('minimum', property, value - range),
										new Filter('maximum', property, value + range)
								  ]
						)
					),
					new Assertion(
						expectedTestBeatmap,
						formatRequest(numericProperty, '=', value, '-'),
						filters.concat(
							numericProperty === 'year'
								? [parseYear('minimum', value), parseYear('maximum', value)]
								: [new Filter('exact', property, value)]
						)
					),
					new Assertion(
						expectedTestBeatmap,
						formatRequest(numericProperty, '<', value),
						filters.concat(
							numericProperty === 'year'
								? [parseYear('maximum', value)]
								: [new Filter('maximum', property, value)]
						)
					),
					new Assertion(
						expectedTestBeatmap,
						formatRequest(numericProperty, '>', value),
						filters.concat(
							numericProperty === 'year'
								? [parseYear('minimum', value)]
								: [new Filter('minimum', property, value)]
						)
					),
					new Assertion(
						expectedTestBeatmap,
						formatRequest(numericProperty, '=', value + 1, '-', value - 1),
						filters.concat(
							numericProperty === 'year'
								? [parseYear('minimum', value + 1), parseYear('maximum', value - 1)]
								: [
										new Filter('minimum', property, value + 1),
										new Filter('maximum', property, value - 1)
								  ]
						)
					),
					new Assertion(
						expectedTestBeatmap,
						formatRequest(numericProperty, '=', value, '-', value),
						filters.concat(
							numericProperty === 'year'
								? [parseYear('minimum', value), parseYear('maximum', value)]
								: [new Filter('exact', property, value)]
						)
					)
				];
			})
			.flat(),
		description: 'Reply to beatmap request command using numeric filters'
	},
	async (handleMessage, data) => {
		mockFetch(
			testBeatmap,
			`${process.env.API_URL}/api/bot/beatmap/request?use_double_time=false`,
			'POST'
		);
		await handleMessage();
		expectRequest(data);
	}
);

botTest(
	{
		assertions: alphanumericGuesses.map(
			(guess) => new Assertion(['didYouMean', `!r ${bpm} ${guess}`], `!r ${bpm} ${guess}_`)
		),
		description: 'Reply to beatmap request command guessing incorrect alphanumeric property'
	},
	(handleMessage) => handleMessage()
);

botTest<Filter[] | [Modification, boolean, Filter[]]>(
	{
		assertions: Object.values(AlphanumericParameter)
			.filter((key) => typeof key === 'string')
			.map((alphanumericProperty) => {
				const message = `!r ${bpm} ${alphanumericProperty}`;
				const parameter =
					alphanumericFilters[
						AlphanumericParameter[alphanumericProperty as keyof typeof AlphanumericParameter]
					];

				if (typeof parameter === 'number') {
					const assertions: Assertion<[Modification, boolean, Filter[]]>[] = [];
					if (parameter === Modification.FreeMod || parameter === Modification.DoubleTime)
						assertions.push(
							new Assertion(['beatmapInformation', testBeatmap, ' +DT |', false], message, [
								parameter,
								true,
								defaultFilters
							])
						);
					if (parameter === Modification.FreeMod || parameter === Modification.NoMod)
						assertions.push(
							new Assertion(expectedTestBeatmap, message, [parameter, false, defaultFilters])
						);
					return assertions;
				}
				const { property, value } = parameter;
				if (typeof value === 'string')
					return [
						new Assertion(
							expectedTestBeatmap,
							message,
							defaultFilters.concat([new Filter('exact', property, value)])
						)
					];
				let filters: Filter[] = defaultFilters;
				if (value[0] !== undefined)
					filters = filters.concat([new Filter('minimum', property, value[0])]);
				if (value[1] !== undefined)
					filters = filters.concat([new Filter('maximum', property, value[1])]);
				return [new Assertion(expectedTestBeatmap, message, filters)];
			})
			.flat(),
		description: 'Reply to beatmap request command using alphanumeric filters'
	},
	async (handleMessage, data) => {
		if (data === undefined) return;
		const useDoubleTime = typeof data[1] === 'boolean' && data[1];
		if (data[0] === Modification.FreeMod)
			jest.spyOn(global.Math, 'random').mockReturnValue(useDoubleTime ? 0.1 : 0.6);
		mockFetch(
			testBeatmap,
			`${process.env.API_URL}/api/bot/beatmap/request?use_double_time=${useDoubleTime}`,
			'POST'
		);
		await handleMessage();
		expectRequest(typeof data[1] === 'boolean' ? data[2] : data, useDoubleTime);
	}
);

botTest(
	{
		assertions: new Assertion('requestNotFound', `!r ${bpm}`, undefined, undefined, [
			testBeatmap.id
		]),
		description: 'Reply to beatmap request command when no beatmap was found'
	},
	async (handleMessage) => {
		mockFetch(404, `${process.env.API_URL}/api/bot/beatmap/request?use_double_time=false`, 'POST');
		mockFetch(404, `${process.env.API_URL}/api/bot/beatmap/request?use_double_time=false`, 'POST');
		await handleMessage();
		expectRequest([new Filter('different', 'id', [testBeatmap.id])].concat(defaultFilters));
		expectRequest(defaultFilters);
	}
);

botTest(
	{
		assertions: new Assertion('requestNotFound', `!r ${bpm} freemod`, undefined, undefined, [
			testBeatmap.id
		]),
		description: 'Reply to beatmap request command when no beatmap was found using freemod filter'
	},
	async (handleMessage) => {
		jest.spyOn(global.Math, 'random').mockReturnValue(0.1);
		mockFetch(404, `${process.env.API_URL}/api/bot/beatmap/request?use_double_time=true`, 'POST');
		mockFetch(404, `${process.env.API_URL}/api/bot/beatmap/request?use_double_time=false`, 'POST');
		mockFetch(404, `${process.env.API_URL}/api/bot/beatmap/request?use_double_time=true`, 'POST');
		mockFetch(404, `${process.env.API_URL}/api/bot/beatmap/request?use_double_time=false`, 'POST');
		await handleMessage();
		expectRequest([new Filter('different', 'id', [testBeatmap.id])].concat(defaultFilters), true);
		expectRequest([new Filter('different', 'id', [testBeatmap.id])].concat(defaultFilters));
		expectRequest(defaultFilters, true);
		expectRequest(defaultFilters);
	}
);
