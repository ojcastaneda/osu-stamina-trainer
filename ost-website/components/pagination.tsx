import styles from '@styles/components/pagination.module.scss';
import { ReactElement, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';

interface PaginationProps {
	limit: number;
}

export default function Pagination({ limit }: PaginationProps) {
	const { t } = useTranslation('components/common');
	const [pages, setPages] = useState<ReactElement[]>([]);
	const router = useRouter();

	useEffect(() => {
		const pageParam = parseInt(
			typeof router.query['page'] === 'string' ? router.query['page'] : '1'
		);
		const page = isNaN(pageParam) ? 1 : pageParam;
		const newPages: ReactElement[] = [];
		for (const index of [...Array(9).keys()]) {
			if (index === 4) {
				newPages.push(
					<div key={`page=${page}`} id={styles['current-page']}>
						{page}
					</div>
				);
				continue;
			}
			if (index !== 0 && index !== 8) {
				const pageValue = page - 4 + index;
				if (pageValue > limit || pageValue < 1) continue;
				newPages.push(
					<Link
						href={{ query: { ...router.query, page: `${pageValue}` } }}
						key={`page=${pageValue}`}
					>
						{pageValue}
					</Link>
				);
				continue;
			}

			newPages.push(
				<Link
					href={{ query: { ...router.query, page: `${index === 0 ? 1 : limit}` } }}
					key={`page=${index === 0 ? 'first' : 'last'}`}
				>
					<a aria-label={t(`${index === 0 ? 'first' : 'last'}_page`)}>
						{index === 0 ? <FaAngleDoubleLeft size={20} /> : <FaAngleDoubleRight size={20} />}
					</a>
				</Link>
			);
		}
		setPages(newPages);
	}, [limit, router.query, t]);

	return <div id={styles['pagination']}>{pages}</div>;
}
