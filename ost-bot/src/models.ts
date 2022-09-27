/**
 * Allowed values for alphanumeric parameters.
 */
export enum AlphanumericParameter {
	alt = 0,
	alternate = 0,
	b = 1,
	bursts = 1,
	d = 2,
	deathstreams = 2,
	dt = 3,
	doubletime = 3,
	l = 5,
	loved = 5,
	r = 7,
	ranked = 7,
	s = 8,
	spaced = 9,
	stacked = 10,
	streams = 8,
	u = 11,
	unranked = 11
}

/**
 * Allowed values for properties of numeric parameters.
 */
export type NumericProperty =
	| 'ar'
	| 'average'
	| 'bpm'
	| 'cs'
	| 'density'
	| 'length'
	| 'longest'
	| 'od'
	| 'pp'
	| 'pp95'
	| 'spacing'
	| 'stars'
	| 'year';

/**
 * Allowed values for properties of alphanumeric filters.
 */
type AlphanumericFilterProperty =
	| 'ranked_status'
	| 'streams_density'
	| 'streams_length'
	| 'streams_spacing';

/**
 * Allowed values for properties of numeric filters.
 */
type NumericFilterProperty =
	| 'accuracy'
	| 'approach_rate'
	| 'bpm'
	| 'circle_size'
	| 'difficulty_rating'
	| 'last_updated'
	| 'length'
	| 'longest_stream'
	| 'performance_100'
	| 'performance_95'
	| 'streams_density'
	| 'streams_length'
	| 'streams_spacing';

/**
 * Allowed values for operators of filters.
 */
export type Operator = 'exact' | 'maximum' | 'minimum';

/**
 * Values for ranked status.
 */
export type RankedStatus = 'loved' | 'ranked' | 'unranked';

/**
 * Response from the server for beatmap request or beatmaps analysis.
 */
export type Beatmap = {
	accuracy: number;
	approach_rate: number;
	bpm: number;
	circle_size: number;
	difficulty_rating: number;
	id: number;
	last_updated: Date;
	length: number;
	longest_stream: number;
	performance_100: number;
	performance_95: number;
	ranked_status: RankedStatus;
	streams_density: number;
	streams_length: number;
	streams_spacing: number;
	title: string;
};

/**
 * Values for parsing or guessing alphanumeric parameters.
 */
export class AlphanumericFilter {
	property: AlphanumericFilterProperty;
	value: RankedStatus | [number | undefined, number | undefined];

	constructor(
		property: AlphanumericFilterProperty,
		value: RankedStatus | [number | undefined, number | undefined]
	) {
		this.property = property;
		this.value = value;
	}
}

/**
 * Filters for beatmap requests to the server.
 */
export class Filter {
	operator: Operator | 'different';
	property: keyof Beatmap;
	value: Date | number | RankedStatus | number[];

	constructor(
		operator: Operator | 'different',
		property: Exclude<keyof Beatmap, 'title'>,
		value: Date | number | RankedStatus | number[]
	) {
		this.operator = operator;
		this.property = property;
		this.value = value;
	}
}

/**
 * Values for parsing or guessing numeric parameters.
 */
export class NumericFilter {
	property: NumericFilterProperty;
	range: number;
	value: number;

	constructor(property: NumericFilterProperty, range: number, value: number) {
		this.property = property;
		this.range = range;
		this.value = value;
	}
}

/**
 * Record of alphanumeric parameters for parsing or guessing commands.
 */
export const alphanumericFilters: Record<AlphanumericParameter, AlphanumericFilter | boolean> = {
	[AlphanumericParameter.alternate]: new AlphanumericFilter('streams_spacing', [1.66, undefined]),
	[AlphanumericParameter.bursts]: new AlphanumericFilter('streams_length', [undefined, 8]),
	[AlphanumericParameter.deathstreams]: new AlphanumericFilter('streams_length', [25, undefined]),
	[AlphanumericParameter.doubletime]: true,
	[AlphanumericParameter.loved]: new AlphanumericFilter('ranked_status', 'loved'),
	[AlphanumericParameter.ranked]: new AlphanumericFilter('ranked_status', 'ranked'),
	[AlphanumericParameter.spaced]: new AlphanumericFilter('streams_spacing', [0.51, 1.65]),
	[AlphanumericParameter.stacked]: new AlphanumericFilter('streams_spacing', [undefined, 0.5]),
	[AlphanumericParameter.streams]: new AlphanumericFilter('streams_length', [9, 24]),
	[AlphanumericParameter.unranked]: new AlphanumericFilter('ranked_status', 'unranked')
};

/**
 * Record of numeric parameters for parsing or guessing commands.
 */
export const numericFilters: Record<NumericProperty, NumericFilter> = {
	ar: new NumericFilter('approach_rate', 0.5, 9),
	average: new NumericFilter('streams_length', 2, 9),
	bpm: new NumericFilter('bpm', 5, 180),
	cs: new NumericFilter('circle_size', 0.5, 4),
	density: new NumericFilter('streams_density', 0.1, 0.5),
	length: new NumericFilter('length', 10, 100),
	longest: new NumericFilter('longest_stream', 5, 25),
	od: new NumericFilter('accuracy', 0.5, 9),
	pp: new NumericFilter('performance_100', 30, 300),
	pp95: new NumericFilter('performance_95', 25, 250),
	spacing: new NumericFilter('streams_spacing', 0.25, 1.0),
	stars: new NumericFilter('difficulty_rating', 0.25, 4),
	year: new NumericFilter('last_updated', 0, 2018)
};

/**
 * Format a message to log to the console.
 *
 * @param content - The content to log.
 * @param level - The Logging level of the interaction.
 * @param origin - The source of the interaction.
 */
export function log(content: string, level: 'ERROR' | 'INFO', origin: 'Discord' | 'osu!') {
	const timestamp = new Date().toISOString();
	switch (level) {
		case 'ERROR':
			return console.error(
				`\x1b[2m${timestamp}\x1b[0m \x1b[31m${level}\x1b[0m \u001b[1m${origin}:\x1b[0m ${content}`
			);
		case 'INFO':
			return console.info(
				`\x1b[2m${timestamp}\x1b[0m \x1b[32m${level}\x1b[0m \u001b[1m${origin}:\x1b[0m ${content}`
			);
	}
}
