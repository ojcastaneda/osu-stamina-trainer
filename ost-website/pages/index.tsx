import Card from '@components/beatmaps/card';
import SearchFilters from '@components/beatmaps/search-filters';
import Pagination from '@components/pagination';
import BeatmapsSearchBar from '@components/beatmaps/search-bar';
import {
	Beatmap,
	BeatmapsByPage,
	Filter,
	Order,
	OrderOperator,
	OrderProperty,
	parseQuery
} from '@models/beatmap';
import { decompressQuery, type Filters, FiltersContext, Property } from '@models/botFilter';
import styles from '@styles/pages/index.module.scss';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { useState } from 'react';
import { serverSideProps } from 'lib/session';

interface IndexProps {
	beatmaps: Beatmap[];
	filters: Filters;
	limit: number;
	order: Order;
	title: string;
}

function Index({ beatmaps, filters, limit, order, title }: IndexProps) {
	return (
		<FiltersContext.Provider value={useState<Filters>(filters)}>
			<BeatmapsSearchBar queryFilters={filters} queryOrder={order} queryTitle={title} />
			<SearchFilters
				allowCollapse
				properties={[
					Property.accuracy,
					Property.approach_rate,
					Property.bpm,
					Property.circle_size,
					Property.difficulty_rating,
					Property.favorite_count,
					Property.last_updated,
					Property.length,
					Property.longest_stream,
					Property.performance_100,
					Property.performance_95,
					Property.play_count,
					Property.ranked_status,
					Property.streams_density,
					Property.streams_length,
					Property.streams_length_type,
					Property.streams_spacing,
					Property.streams_spacing_type
				]}
			/>
			<div id={styles['beatmaps']}>
				{beatmaps.map((beatmap) => (
					<Card beatmap={beatmap} key={`beatmap=${beatmap.id}`} />
				))}
			</div>
			<Pagination limit={limit} />
		</FiltersContext.Provider>
	);
}

Index.head = 'collection';

export default Index;

export async function getServerSideProps(
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<IndexProps>> {
	const { botFilters, filters, order, page, title } = parseParameters(context.query);
	const request = await fetch(
		`${
			typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL
		}/api/beatmap/page/${page}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				filters,
				order,
				title
			})
		}
	);
	const { beatmaps, limit }: BeatmapsByPage = request.ok
		? await request.json()
		: { beatmaps: [], limit: 1 };
	return {
		props: JSON.parse(
			JSON.stringify({
				beatmaps,
				filters: botFilters,
				limit,
				order,
				title,
				...(await serverSideProps(context, ['components/beatmaps', 'components/common']))
			})
		)
	};
}

export interface Search {
	botFilters: Filters;
	filters: Filter[];
	order: Order;
	page: number;
	title?: string;
}

function parseParameters(parameters: ParsedUrlQuery): Search {
	const page = parseInt(typeof parameters['page'] === 'string' ? parameters['page'] : '1');
	const order = typeof parameters['order'] === 'string' ? parameters['order'].split('-') : [];
	const operator = parseInt(order[1]);
	const property = parseInt(order[0]);
	const botFilters = decompressQuery(
		typeof parameters['query'] === 'string' ? parameters['query'] : ''
	);
	return {
		botFilters,
		filters: parseQuery(botFilters),
		order: {
			operator: isNaN(operator)
				? 'descending'
				: (OrderOperator[operator] as keyof typeof OrderOperator),
			property: isNaN(property)
				? 'last_updated'
				: (OrderProperty[property] as keyof typeof OrderProperty)
		},
		page: isNaN(page) ? 1 : page,
		title: typeof parameters['title'] === 'string' ? parameters['title'] : undefined
	};
}
