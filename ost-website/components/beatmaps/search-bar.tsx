import { Order, OrderOperator, OrderProperty, parseQuery } from '@models/beatmap';
import { compressQuery, Filters, FiltersContext } from '@models/botFilter';
import styles from '@styles/components/beatmaps/search-bar.module.scss';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { ChangeEvent, useContext, useState } from 'react';
import { FaSearch, FaSortAmountDown, FaSortAmountDownAlt } from 'react-icons/fa';

interface SearchBarProps {
	queryFilters: Filters;
	queryOrder: Order;
	queryTitle: string;
}

enum CollectionFile {
	BPMDB,
	BPMOSDB,
	CollectionDB,
	CollectionOSDB
}

export default function BeatmapsSearchBar({
	queryFilters,
	queryOrder,
	queryTitle
}: SearchBarProps) {
	const { t } = useTranslation(['components/beatmaps', 'components/common']);
	const [title, setTitle] = useState(queryTitle);
	const [filters] = useContext(FiltersContext);
	const router = useRouter();

	function submit() {
		router.query['title'] = !title ? [] : title;
		router.query['query'] = compressQuery(filters) ?? [];
		router.query['page'] = '1';
		router.push({ query: router.query });
	}

	function changeOrderProperty({ target }: ChangeEvent<HTMLSelectElement>) {
		router.query['order'] = `${target.value}-${OrderOperator[queryOrder.operator]}`;
		submit();
	}

	function changeOrderOperator() {
		router.query['order'] = `${OrderProperty[queryOrder.property]}-${
			OrderOperator[queryOrder.operator] === OrderOperator.ascending
				? OrderOperator.descending
				: OrderOperator.ascending
		}`;
		submit();
	}

	async function downloadCollection({ target }: ChangeEvent<HTMLSelectElement>) {
		if (target.value === '') return;
		const option = parseInt(target.value);
		const use_osdb_format =
			option === CollectionFile.BPMOSDB || option === CollectionFile.CollectionOSDB;
		target.value = '';
		const response = await fetch(`/api/beatmap/collection`, {
			method: 'POST',
			body: JSON.stringify({
				filters: parseQuery(queryFilters),
				title: queryTitle,
				use_bpm_division: option === CollectionFile.BPMDB || option === CollectionFile.BPMOSDB,
				use_osdb_format
			}),
			headers: {
				Accept: 'application/octet-stream',
				'Content-Type': 'application/json'
			}
		});
		if (!response.ok) return;
		const url = window.URL.createObjectURL(await response.blob());
		const a = document.createElement('a');
		a.href = url;
		a.download = `Collection.${use_osdb_format ? 'osdb' : 'db'}`;
		document.body.appendChild(a);
		a.style.display = 'none';
		a.click();
		a.remove();
		window.URL.revokeObjectURL(url);
	}

	return (
		<div id={styles['search-bar']}>
			<div id={styles['search-title']}>
				<input
					onChange={({ target }) => setTitle(target.value)}
					onKeyDown={({ key }) => key === 'Enter' && submit()}
					placeholder={t('search_title', { ns: 'components/common' })}
					value={title}
				/>
				<button onClick={() => submit()}>
					<div>
						<FaSearch size={20} />
					</div>
				</button>
			</div>
			<div id={styles['search-order']}>
				<select value={OrderProperty[queryOrder.property]} onChange={changeOrderProperty}>
					{[
						OrderProperty.bpm,
						OrderProperty.difficulty_rating,
						OrderProperty.favorite_count,
						OrderProperty.last_updated,
						OrderProperty.length,
						OrderProperty.longest_stream,
						OrderProperty.performance_100,
						OrderProperty.play_count,
						OrderProperty.streams_density,
						OrderProperty.streams_length,
						OrderProperty.streams_spacing
					].map((option) => (
						<option key={`order-property=${option}`} value={option}>
							{t(OrderProperty[option])}
						</option>
					))}
				</select>
				<button onClick={changeOrderOperator}>
					<div>
						{OrderOperator[queryOrder.operator] === OrderOperator.ascending ? (
							<FaSortAmountDownAlt size={20} />
						) : (
							<FaSortAmountDown size={20} />
						)}
					</div>
				</button>
			</div>
			<div id={styles['search-download']}>
				<select onChange={downloadCollection}>
					<option value="">{t('download_search')}</option>
					<option value={CollectionFile.CollectionDB}>{t('download_db_single')}</option>
					<option value={CollectionFile.CollectionOSDB}>{t('download_osdb_single')}</option>
					<option value={CollectionFile.BPMDB}>{t('download_db_divided')}</option>
					<option value={CollectionFile.BPMOSDB}>{t('download_osdb_divided')}</option>
				</select>
			</div>
		</div>
	);
}
