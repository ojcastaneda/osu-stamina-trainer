import styles from '@styles/pages/submit.module.scss';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { useTranslation } from 'next-i18next';
import { ChangeEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { ServerSideProps, serverSideProps } from 'lib/session';

const combinedRegex = new RegExp('^https://osu.ppy.sh/beatmapsets/[0-9]+#osu/[0-9]+');
const idRegex = new RegExp('[0-9]+', 'g');

enum Error {
	AlreadySubmitted,
	UnexpectedError
}

function SubmitBeatmaps() {
	const { t } = useTranslation(['pages/submit']);
	const [result, setResult] = useState<undefined | Error | 'beatmap' | 'beatmapset'>();
	const [submission, setSubmission] = useState<[number, number]>([1335452, 2766688]);
	const [background, setBackground] = useState('/cover.png');
	const [url, setUrl] = useState('');

	async function submit(id: number, isBeatmapset = false) {
		const request = await fetch(`/api/submission/${isBeatmapset ? -id : id}`, { method: 'POST' });
		if (request.status === 409) {
			setUrl('');
			setResult(Error.AlreadySubmitted);
			return;
		}
		if (!request.ok) {
			setResult(Error.UnexpectedError);
			return;
		}
		setUrl('');
		setResult(isBeatmapset ? 'beatmapset' : 'beatmap');
	}

	function inputChange({ target }: ChangeEvent<HTMLInputElement>) {
		setUrl(target.value);
		setResult(undefined);
	}

	useEffect(() => {
		if (!combinedRegex.test(url)) return setBackground('/cover.png');
		const matchedId = url.match(idRegex);
		if (matchedId === null || matchedId[0] === undefined || matchedId[1] === undefined)
			return setBackground('/cover.png');
		const beatmapsetId = parseInt(matchedId[0]);
		const beatmapId = parseInt(matchedId[1]);
		setBackground(`https://assets.ppy.sh/beatmaps/${beatmapsetId}/covers/cover.jpg`);
		setSubmission([beatmapsetId, beatmapId]);
	}, [url]);

	return (
		<div id={styles['submit']}>
			<form onSubmit={(event) => event.preventDefault()}>
				<div id={styles['submit-input']}>
					<input
						className={typeof result === 'number' ? 'error' : ''}
						maxLength={60}
						onChange={inputChange}
						placeholder="https://osu.ppy.sh/beatmapsets/1335452#osu/2766688"
						size={46}
						value={url}
					/>
					{typeof result === 'number' && <span className="error">{t(`error_${result}`)}.</span>}
					{typeof result === 'string' && <span>{t(`${result}_submitted`)}.</span>}
				</div>
				<div id={styles['submit-buttons']}>
					<button disabled={!combinedRegex.test(url)} onClick={() => submit(submission[1])}>
						{t('submit_beatmap')}
					</button>
					<button disabled={!combinedRegex.test(url)} onClick={() => submit(submission[0], true)}>
						{t('submit_beatmapset')}
					</button>
				</div>
				<div className="osu-image">
					<Image
						alt={background}
						fill
						onError={() => setBackground('/cover.png')}
						priority
						src={background}
					/>
				</div>
			</form>
			<div>
				<h2>{t('submission_rules')}</h2>
				<ol id={styles['submit-rules']}>
					<li>{t('submission_rule_1')}.</li>
					<li>{t('submission_rule_2')}.</li>
					<li>{t('submission_rule_3')}.</li>
					<li>{t('submission_rule_4')}.</li>
				</ol>
			</div>
		</div>
	);
}

SubmitBeatmaps.head = 'submit_beatmaps';

export default SubmitBeatmaps;

export async function getServerSideProps(
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<ServerSideProps>> {
	return {
		props: await serverSideProps(context, ['pages/submit'])
	};
}
