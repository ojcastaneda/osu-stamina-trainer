import { type Beatmap, RankedStatus } from '@models/beatmap';
import styles from '@styles/components/beatmaps/card.module.scss';
import { useState } from 'react';
import Image from 'next/image';
import {
	FaAngleDoubleUp,
	FaAngleDown,
	FaAngleUp,
	FaItunesNote,
	FaPlayCircle,
	FaQuestion,
	FaRegClock,
	FaRegHeart
} from 'react-icons/fa';
import { MdEditCalendar } from 'react-icons/md';
import Link from 'next/link';

interface CardProps {
	beatmap: Beatmap;
}

export default function Card({ beatmap }: CardProps) {
	const [background, setBackgound] = useState(
		`https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/cover.jpg`
	);
	const [expanded, setExpanded] = useState<boolean>(false);

	return (
		<div className={styles['card']}>
			<span className={styles['card-icon']}>
				{beatmap.ranked_status === RankedStatus[RankedStatus.loved] ? (
					<FaRegHeart size={20} />
				) : beatmap.ranked_status === RankedStatus[RankedStatus.ranked] ? (
					<FaAngleDoubleUp size={20} />
				) : (
					<FaQuestion size={20} />
				)}
			</span>
			<Link href={`https://osu.ppy.sh/beatmapsets/${beatmap.beatmapset_id}#osu/${beatmap.id}`}>
				<a className="osu-image" target="_blank">
					<Image
						alt={beatmap.title}
						layout="fill"
						onError={() => setBackgound('/cover.png')}
						priority
						src={background}
					/>
				</a>
			</Link>
			<Link href={`https://osu.ppy.sh/beatmapsets/${beatmap.beatmapset_id}#osu/${beatmap.id}`}>
				<a
					className={`${styles['card-title']} ${expanded ? styles['expanded'] : ''}`}
					target="_blank"
				>
					{beatmap.title}
				</a>
			</Link>
			<div className={styles['card-content']}>
				<div>
					<FaItunesNote size={15} />
					<div>{beatmap.bpm}</div>
				</div>
				<div>
					<FaRegClock size={15} />
					<div>
						{Math.floor(beatmap.length / 60)}:{beatmap.length % 60 < 10 ? '0' : ''}
						{beatmap.length % 60}
					</div>
				</div>
				<div>
					<FaRegHeart size={15} />
					<div>{beatmap.favorite_count}</div>
				</div>
				<div>
					<svg className={styles['bpm-icon']} height={15} viewBox="0 0 512 512">
						<path
							d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256ZM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48Z"
							fill="white"
						/>
						<circle cx="256" cy="256" r="160" fill="white" />
					</svg>
					<div>
						{beatmap.streams_length} ({beatmap.longest_stream})
					</div>
				</div>
				<div>
					<MdEditCalendar size={15} />
					<div>{new Date(beatmap.last_updated).getFullYear()}</div>
				</div>
				<div>
					<FaPlayCircle size={15} />
					<div>{beatmap.play_count}</div>
				</div>
			</div>
			{expanded && (
				<>
					<table className={styles['card-details']}>
						<tbody>
							<Detail maximum={10} name="OD" value={beatmap.accuracy} />
							<Detail maximum={10} name="AR" value={beatmap.approach_rate} />
							<Detail maximum={10} name="CS" value={beatmap.circle_size} />
							<Detail maximum={10} name="Stars" value={beatmap.difficulty_rating} />
							<Detail maximum={1} name="Density" value={beatmap.streams_density} />
							<Detail maximum={4} name="Spacing" value={beatmap.streams_spacing} />
						</tbody>
					</table>
					<div className={styles['card-performance']}>
						<div>100%: {beatmap.performance_100}PP</div>
						<div>95%: {beatmap.performance_95}PP</div>
					</div>
				</>
			)}
			<div>
				<button
					className={styles['card-expand-button']}
					onClick={() => setExpanded((previousState) => !previousState)}
				>
					{expanded ? <FaAngleUp size={25} /> : <FaAngleDown size={25} />}
				</button>
			</div>
		</div>
	);
}

interface DetailProps {
	maximum: number;
	name: string;
	value: number;
}

function Detail({ maximum, name, value }: DetailProps) {
	return (
		<tr>
			<td>{name}</td>
			<td className={styles['card-bar']}>
				<div>
					<div style={{ width: `${Math.min((value * 100) / maximum, 100)}%` }} />
				</div>
			</td>
			<td>{value}</td>
		</tr>
	);
}
