import {
	AverageType,
	Filters,
	Operator as BotOperator,
	Property as BotProperty,
	SpacingType
} from '@models/botFilter';

export type Operator = 'exact' | 'maximum' | 'minimum';

export enum OrderOperator {
	ascending,
	descending
}

export enum OrderProperty {
	bpm,
	difficulty_rating,
	favorite_count,
	last_updated,
	length,
	longest_stream,
	performance_100,
	performance_95,
	play_count,
	streams_density,
	streams_length,
	streams_spacing
}

export type Property =
	| 'accuracy'
	| 'approach_rate'
	| 'bpm'
	| 'circle_size'
	| 'difficulty_rating'
	| 'favorite_count'
	| 'last_updated'
	| 'length'
	| 'longest_stream'
	| 'performance_100'
	| 'performance_95'
	| 'play_count'
	| 'ranked_status'
	| 'streams_density'
	| 'streams_length'
	| 'streams_spacing';

export enum RankedStatus {
	loved,
	ranked,
	unranked
}

export interface Beatmap {
	accuracy: number;
	approach_rate: number;
	beatmapset_id: number;
	bpm: number;
	circle_size: number;
	difficulty_rating: number;
	favorite_count: number;
	id: number;
	last_updated: Date;
	length: number;
	longest_stream: number;
	performance_100: number;
	performance_95: number;
	play_count: number;
	ranked_status: keyof typeof RankedStatus;
	streams_density: number;
	streams_length: number;
	streams_spacing: number;
	title: string;
}
export interface BeatmapsByPage {
	beatmaps: Beatmap[];
	limit: number;
}

export class Filter {
	operator: Operator;
	property: keyof Beatmap;
	value: Date | number | keyof typeof RankedStatus;

	constructor(operator: Operator, property: Property, value: Date | number | RankedStatus) {
		this.operator = operator;
		this.property = property;
		this.value =
			property === 'ranked_status'
				? (RankedStatus[value as RankedStatus] as keyof typeof RankedStatus)
				: value;
	}
}

export interface Order {
	operator: keyof typeof OrderOperator;
	property: keyof typeof OrderProperty;
}

export function parseQuery(filters: Filters): Filter[] {
	let parsedFilters: Filter[] = [];
	for (const [property, { operator, value }] of Object.entries(filters)) {
		const intProperty = parseInt(property);
		const [parsedProperty, defaultRange] = parseProperty(intProperty);

		if (intProperty === BotProperty.streams_length_type) {
			parsedFilters = parsedFilters.concat(parseAverageType(value[0]));
			continue;
		}
		if (intProperty === BotProperty.streams_spacing_type) {
			parsedFilters = parsedFilters.concat(parseSpacingType(value[0]));
			continue;
		}
		switch (operator) {
			case BotOperator.default:
				parsedFilters = parsedFilters.concat(
					intProperty === BotProperty.last_updated
						? [parseYear('minimum', value[0]), parseYear('maximum', value[0])]
						: [
								new Filter('minimum', parsedProperty, value[0] - defaultRange),
								new Filter('maximum', parsedProperty, value[0] + defaultRange)
						  ]
				);
				continue;
			case BotOperator.range:
				if (value[0] !== value[1]) {
					parsedFilters = parsedFilters.concat(
						intProperty === BotProperty.last_updated
							? [parseYear('minimum', value[0]), parseYear('maximum', value[1])]
							: [
									new Filter('minimum', parsedProperty, value[0]),
									new Filter('maximum', parsedProperty, value[1])
							  ]
					);
					continue;
				}
			// falls through
			case BotOperator.exact:
				parsedFilters = parsedFilters.concat(
					intProperty === BotProperty.last_updated
						? [parseYear('minimum', value[0]), parseYear('maximum', value[0])]
						: [new Filter('exact', parsedProperty, value[0])]
				);
				continue;
			case BotOperator.maximum:
				parsedFilters.push(
					intProperty === BotProperty.last_updated
						? parseYear('maximum', value[0])
						: new Filter('maximum', parsedProperty, value[0])
				);
				continue;
			case BotOperator.minimum:
				parsedFilters.push(
					intProperty === BotProperty.last_updated
						? parseYear('minimum', value[0])
						: new Filter('minimum', parsedProperty, value[0])
				);
				continue;
		}
	}
	return parsedFilters;
}

export function parseStreamsLength(streams_length: number): AverageType {
	if (streams_length < 9) return AverageType.bursts;
	else if (streams_length < 25) return AverageType.streams;
	return AverageType.deathstreams;
}

function parseAverageType(type: AverageType): Filter[] {
	if (type === AverageType.streams) {
		return [
			new Filter('minimum', 'streams_length', 9),
			new Filter('maximum', 'streams_length', 24)
		];
	}
	return [
		type === AverageType.bursts
			? new Filter('maximum', 'streams_length', 8)
			: new Filter('minimum', 'streams_length', 25)
	];
}

function parseSpacingType(type: SpacingType): Filter[] {
	if (type === SpacingType.spaced) {
		return [
			new Filter('minimum', 'streams_spacing', 0.51),
			new Filter('maximum', 'streams_spacing', 1.65)
		];
	}
	return [
		type === SpacingType.stacked
			? new Filter('maximum', 'streams_spacing', 0.5)
			: new Filter('minimum', 'streams_spacing', 1.66)
	];
}

function parseYear(operator: 'maximum' | 'minimum', value: number | [number, number]): Filter {
	return operator === 'maximum'
		? new Filter(operator, 'last_updated', new Date(`${value}-12-31T23:59:59.999+00:00`))
		: new Filter(operator, 'last_updated', new Date(`${value}-01-01T00:00:00+00:00`));
}

export function parseProperty(property: BotProperty): [Property, number] {
	switch (property) {
		case BotProperty.accuracy:
			return ['accuracy', 0.5];
		case BotProperty.approach_rate:
			return ['approach_rate', 0.5];
		case BotProperty.bpm:
			return ['bpm', 5];
		case BotProperty.circle_size:
			return ['circle_size', 0.5];
		case BotProperty.difficulty_rating:
			return ['difficulty_rating', 0.25];
		case BotProperty.favorite_count:
			return ['favorite_count', 0];
		case BotProperty.last_updated:
			return ['last_updated', 0];
		case BotProperty.length:
			return ['length', 10];
		case BotProperty.longest_stream:
			return ['longest_stream', 5];
		case BotProperty.performance_100:
			return ['performance_100', 30];
		case BotProperty.performance_95:
			return ['performance_95', 25];
		case BotProperty.play_count:
			return ['play_count', 0];
		case BotProperty.ranked_status:
			return ['ranked_status', 0];
		case BotProperty.streams_density:
			return ['streams_density', 0.1];
		case BotProperty.streams_length:
		case BotProperty.streams_length_type:
			return ['streams_length', 2];
		case BotProperty.streams_spacing:
		case BotProperty.streams_spacing_type:
			return ['streams_spacing', 0.25];
	}
}
