import { OrderOperator } from '@models/beatmap';
import { ApprovalStatus } from '@models/submission';
import styles from '@styles/components/submissions/search-bar.module.scss';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { ChangeEvent, useState } from 'react';
import { FaSearch, FaSortAmountDown, FaSortAmountDownAlt } from 'react-icons/fa';

interface SearchBarProps {
	filter: keyof typeof ApprovalStatus | '';
	queryOrder: keyof typeof OrderOperator;
	queryTitle: string;
}

export default function SearchBar({ filter, queryOrder, queryTitle }: SearchBarProps) {
	const { t } = useTranslation(['components/submissions', 'components/common']);
	const [title, setTitle] = useState(queryTitle);
	const router = useRouter();

	function submit() {
		router.query['title'] = !title ? [] : title;
		router.query['page'] = '1';
		router.push({ query: router.query });
	}

	function changeFilter({ target }: ChangeEvent<HTMLSelectElement>) {
		router.query['filter'] = target.value === '' ? [] : `${target.value}`;
		submit();
	}

	function changeOrder() {
		router.query['order'] = `${
			OrderOperator[queryOrder] === OrderOperator.ascending
				? OrderOperator.descending
				: OrderOperator.ascending
		}`;
		submit();
	}

	return (
		<div id={styles['search-bar']}>
			<div id={styles['search-title']}>
				<input
					id={styles['title-search']}
					onChange={({ target }) => setTitle(target.value)}
					onKeyDown={({ key }) => key === 'Enter' && submit()}
					placeholder={t('search_title', { ns: 'components/common' })}
					value={title}
				/>
				<button
					aria-label={t('update_search', { ns: 'components/common' })}
					id={styles['search-button']}
					onClick={() => submit()}
				>
					<div>
						<FaSearch size={20} />
					</div>
				</button>
			</div>
			<div id={styles['search-order']}>
				<select
					value={ApprovalStatus[filter as keyof typeof ApprovalStatus]}
					onChange={changeFilter}
				>
					<option value=""> {t('all_status')}</option>
					{[ApprovalStatus.approved, ApprovalStatus.pending, ApprovalStatus.processing].map(
						(option) => (
							<option key={`order-property=${option}`} value={option}>
								{t(ApprovalStatus[option])}
							</option>
						)
					)}
				</select>
				<button aria-label={t('change_order', { ns: 'components/common' })} onClick={changeOrder}>
					<div>
						{OrderOperator[queryOrder] === OrderOperator.ascending ? (
							<FaSortAmountDownAlt size={20} />
						) : (
							<FaSortAmountDown size={20} />
						)}
					</div>
				</button>
			</div>
		</div>
	);
}
