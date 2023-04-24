import styles from '@styles/components/submissions/card.module.scss';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ApprovalStatus, Submission } from '@models/submission';
import { FaCheck, FaClock, FaQuestion } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

interface CardProps {
	submission: Submission;
}

export default function Card({ submission }: CardProps) {
	const { t } = useTranslation('components/submissions');
	const [background, setBackground] = useState(
		`https://assets.ppy.sh/beatmaps/${submission.beatmapset_id}/covers/cover.jpg`
	);
	const [expanded, setExpanded] = useState<boolean>(false);
	const router = useRouter();

	async function approve() {
		const request = await fetch(`/api/submission/${submission.id}/approve`, {
			method: 'POST',
			credentials: 'include'
		});
		if (request.ok) router.push(router.asPath);
	}

	async function remove() {
		const request = await fetch(`/api/submission/${submission.id}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (request.ok) router.push(router.asPath);
	}

	return (
		<div className={styles['card']}>
			<span className={styles['card-icon']}>
				{submission.approval_status === ApprovalStatus[ApprovalStatus.approved] ? (
					<FaCheck size={20} />
				) : submission.approval_status === ApprovalStatus[ApprovalStatus.pending] ? (
					<FaQuestion size={20} />
				) : (
					<FaClock size={20} />
				)}
			</span>
			<Link
				className="osu-image"
				href={`https://osu.ppy.sh/beatmapsets/${submission.beatmapset_id}#osu/${submission.id}`}
				target="_blank"
			>
				<Image
					alt={submission.title}
					fill
					onError={() => setBackground('/cover.png')}
					priority
					src={background}
				/>
			</Link>
			<Link
				className={`${styles['card-title']} ${expanded ? styles['expanded'] : ''}`}
				href={`https://osu.ppy.sh/beatmapsets/${submission.beatmapset_id}#osu/${submission.id}`}
				onMouseEnter={() => setExpanded(true)}
				onMouseLeave={() => setExpanded(false)}
				target="_blank"
			>
				{submission.title}
			</Link>
			<div className={styles['card-content']}>
				<button
					disabled={submission.approval_status !== ApprovalStatus[ApprovalStatus.pending]}
					onClick={approve}
				>
					{t('approve')}
				</button>
				<button onClick={remove}>{t('remove')}</button>
			</div>
		</div>
	);
}
