import { createContext, Dispatch, SetStateAction } from 'react';

export enum RankedStatusShort {
	l,
	r,
	u
}

export enum AverageType {
	bursts,
	deathstreams,
	streams
}

export enum AverageTypeShort {
	b,
	d,
	s
}

export enum Operator {
	default,
	exact,
	maximum,
	minimum,
	range
}

export enum Property {
	accuracy,
	approach_rate,
	bpm,
	circle_size,
	difficulty_rating,
	favorite_count,
	last_updated,
	length,
	longest_stream,
	performance_100,
	performance_95,
	play_count,
	ranked_status,
	streams_density,
	streams_length,
	streams_length_type,
	streams_spacing,
	streams_spacing_type
}

export enum SpacingType {
	alternate,
	spaced,
	stacked
}

export enum SpacingTypeShort {
	alt,
	spaced,
	stacked
}

export class Filter {
	operator: Operator;
	value: [number, number];

	constructor(operator: Operator, value: [number, number]) {
		this.operator = operator;
		this.value = value;
	}
}

export type Filters = Partial<Record<Property, Filter>>;

export function compressQuery(filters: Filters): string | string[] {
	const query: string[] = [];
	for (const [property, { operator, value }] of Object.entries(filters)) {
		query.push([property, operator, ...value].join('-'));
	}
	if (query.length < 1) return [];
	return query.join('_');
}

export function decompressQuery(query: string): Filters {
	const filters: Filters = {};
	for (const parameter of query.split('_')) {
		const components = parameter.split('-');
		const property = parseInt(components[0]);
		const operator = parseInt(components[1]);
		if (isNaN(property) || isNaN(operator)) continue;
		const range: [number, number] = [parseFloat(components[2]), parseFloat(components[3])];
		if (isNaN(range[0]) || isNaN(range[1])) continue;
		filters[property as Property] = new Filter(operator, range);
	}
	return filters;
}

export const FiltersContext = createContext<[Filters, Dispatch<SetStateAction<Filters>>]>([
	{},
	() => ({})
]);
