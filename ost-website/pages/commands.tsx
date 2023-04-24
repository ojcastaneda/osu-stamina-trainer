import SearchFilters from '@components/beatmaps/search-filters';
import NumericInput from '@components/numeric-input';
import { RankedStatus } from '@models/beatmap';
import {
	AverageType,
	AverageTypeShort,
	Filter,
	Filters,
	FiltersContext,
	Operator,
	Property,
	RankedStatusShort,
	SpacingType,
	SpacingTypeShort
} from '@models/botFilter';
import styles from '@styles/pages/commands.module.scss';
import { ServerSideProps, serverSideProps } from 'lib/session';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { SetStateAction, useEffect, useState } from 'react';
import { FaCopy, FaDiscord } from 'react-icons/fa';
import { MdTranslate } from 'react-icons/md';

enum Modification {
	NoMod,
	DoubleTime,
	FreeMod
}

function BotCommands() {
	const { t } = useTranslation(['pages/commands', 'common']);
	const [filters, setFilters] = useState<Filters>({
		[Property.bpm]: new Filter(Operator.default, [180, 0])
	});
	const [request, setRequest] = useState('');
	const [userId, setUserId] = useState(6484647);
	const [beatmapId, setBeatmapId] = useState(2766688);
	const [language, setLanguage] = useState('en');
	const [useShort, setUseShort] = useState(false);
	const [modification, setModification] = useState(Modification.NoMod);

	function setFiltersCommands(state: SetStateAction<Filters>) {
		setFilters((prevState) => {
			const newFilters = typeof state === 'function' ? state(prevState) : state;
			if (newFilters[Property.bpm] === undefined) {
				newFilters[Property.bpm] =
					prevState[Property.bpm] ?? new Filter(Operator.default, [180, 0]);
			}
			return newFilters;
		});
	}

	useEffect(() => {
		const checkedFilters = { ...filters };
		if (filters[Property.bpm] === undefined) {
			checkedFilters[Property.bpm] = new Filter(Operator.default, [180, 0]);
		}
		setRequest(parseFilters(checkedFilters, modification, useShort));
	}, [filters, useShort, modification]);

	return (
		<FiltersContext.Provider value={[filters, setFiltersCommands]}>
			<div id={styles['bot-links']}>
				<div>
					<h2>
						<svg id={styles['osu-icon']} height={50} viewBox="0 0 350 350">
							<path d="M100.1,206.4c-4.7,0-8.8-0.8-12.3-2.3s-6.4-3.7-8.6-6.4  c-2.3-2.7-4-5.9-5.2-9.6c-1.2-3.7-1.7-7.6-1.7-11.9c0-4.3,0.6-8.3,1.7-12c1.2-3.7,2.9-7,5.2-9.7c2.3-2.7,5.2-4.9,8.6-6.5  s7.6-2.4,12.3-2.4c4.7,0,8.8,0.8,12.3,2.4c3.5,1.6,6.4,3.7,8.8,6.5c2.3,2.7,4,6,5.2,9.7c1.1,3.7,1.7,7.7,1.7,12  c0,4.3-0.6,8.2-1.7,11.9c-1.1,3.7-2.8,6.9-5.2,9.6c-2.3,2.7-5.2,4.9-8.8,6.4C109,205.7,104.8,206.4,100.1,206.4z M100.1,194.3  c4.2,0,7.2-1.6,9-4.7c1.8-3.1,2.7-7.6,2.7-13.4c0-5.8-0.9-10.3-2.7-13.4c-1.8-3.1-4.8-4.7-9-4.7c-4.1,0-7.1,1.6-8.9,4.7  c-1.8,3.1-2.7,7.6-2.7,13.4c0,5.8,0.9,10.3,2.7,13.4C93,192.8,96,194.3,100.1,194.3z M151.9,179.8c-4.2-1.2-7.5-3-9.8-5.3  c-2.4-2.4-3.5-5.9-3.5-10.6c0-5.7,2-10.1,6.1-13.4c4.1-3.2,9.6-4.8,16.7-4.8c2.9,0,5.8,0.3,8.6,0.8c2.8,0.5,5.7,1.3,8.6,2.4  c-0.2,1.9-0.5,4-1.1,6.1c-0.6,2.1-1.3,3.9-2.1,5.5c-1.8-0.7-3.8-1.4-5.9-2c-2.2-0.6-4.5-0.8-6.8-0.8c-2.5,0-4.5,0.4-5.9,1.2  c-1.4,0.8-2.1,2-2.1,3.8c0,1.6,0.5,2.8,1.5,3.5c1,0.7,2.4,1.3,4.3,1.9l6.4,1.9c2.1,0.6,4,1.3,5.7,2.2c1.7,0.9,3.1,1.9,4.3,3.2  c1.2,1.3,2.1,2.8,2.8,4.7c0.7,1.9,1,4.2,1,6.8c0,2.8-0.6,5.3-1.7,7.7c-1.2,2.4-2.8,4.5-5,6.2c-2.2,1.8-4.9,3.1-8,4.2  c-3.1,1-6.7,1.5-10.7,1.5c-1.8,0-3.4-0.1-4.9-0.2c-1.5-0.1-2.9-0.3-4.3-0.6c-1.4-0.3-2.7-0.6-4.1-1c-1.3-0.4-2.8-0.9-4.4-1.5  c0.1-2,0.5-4.1,1.1-6.1c0.6-2.1,1.3-4.1,2.2-6c2.5,1,4.8,1.7,7,2.2c2.2,0.5,4.5,0.7,6.9,0.7c1,0,2.2-0.1,3.4-0.3  c1.2-0.2,2.4-0.5,3.4-1c1-0.5,1.9-1.1,2.6-1.9c0.7-0.8,1.1-1.8,1.1-3.1c0-1.8-0.5-3.1-1.6-3.9c-1.1-0.8-2.6-1.5-4.5-2.1L151.9,179.8  z M191.2,147.1c2.7-0.4,5.3-0.7,8-0.7c2.6,0,5.3,0.2,8,0.7v30.7c0,3.1,0.2,5.6,0.7,7.6c0.5,2,1.2,3.6,2.2,4.7c1,1.2,2.3,2,3.8,2.5  c1.5,0.5,3.3,0.7,5.3,0.7c2.8,0,5.1-0.3,7-0.8v-45.4c2.7-0.4,5.3-0.7,7.9-0.7c2.6,0,5.3,0.2,8,0.7v55.8c-2.4,0.8-5.6,1.6-9.5,2.4  c-3.9,0.8-8,1.2-12.3,1.2c-3.8,0-7.5-0.3-11-0.9c-3.5-0.6-6.6-1.9-9.3-3.8c-2.7-1.9-4.8-4.8-6.3-8.5c-1.6-3.7-2.4-8.7-2.4-14.9  V147.1z M257.1,205.1c-0.4-2.8-0.7-5.5-0.7-8.2c0-2.7,0.2-5.5,0.7-8.3c2.8-0.4,5.5-0.7,8.2-0.7c2.7,0,5.5,0.2,8.3,0.7  c0.4,2.8,0.7,5.6,0.7,8.2c0,2.8-0.2,5.5-0.7,8.3c-2.8,0.4-5.6,0.7-8.2,0.7C262.6,205.7,259.9,205.5,257.1,205.1z M256.7,124.4  c2.9-0.4,5.8-0.7,8.6-0.7c2.9,0,5.8,0.2,8.8,0.7l-1.1,54.9c-2.6,0.4-5.1,0.7-7.5,0.7c-2.5,0-5.1-0.2-7.6-0.7L256.7,124.4z" />
							<path d="M175,25C92.2,25,25,92.2,25,175c0,82.8,67.2,150,150,150c82.8,0,150-67.2,150-150  C325,92.2,257.8,25,175,25z M175,310c-74.6,0-135-60.4-135-135c0-74.6,60.4-135,135-135s135,60.4,135,135  C310,249.6,249.6,310,175,310z" />
						</svg>
						<div>osu!: Sombrax79</div>
					</h2>
					<Link href={`https://osu.ppy.sh/users/${process.env.NEXT_PUBLIC_OSU_ID}`} target="_blank">
						{t('osu_profile')}
					</Link>
				</div>
				<div>
					<h2>
						<FaDiscord size={50} />
						<div>Discord: OSTBot#2876</div>
					</h2>
					<Link
						href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_ID}&permissions=2048&scope=applications.commands%20bot`}
						target="_blank"
					>
						{t('invite_discord')}
					</Link>
				</div>
			</div>
			<div id={styles['bot-commands']}>
				<section>
					<div>!request / !r</div>
					<div>
						<div>{t('request')}.</div>
						<div id={styles['request']}>
							<div className={styles['copy-input']}>
								<input aria-label={t('request_command')} disabled value={request} />
								<button
									aria-label={t('copy_command')}
									onClick={() => navigator.clipboard.writeText(request)}
								>
									<FaCopy />
								</button>
							</div>
							<div>
								<select
									onChange={({ target }) => setModification(parseInt(target.value))}
									value={-1}
								>
									<option value={-1}>{t('filter_by_modification')}</option>
									<option value={Modification.DoubleTime}>{t('use_double_time')}</option>
									<option value={Modification.NoMod}>{t('use_no_modification')}</option>
									<option value={Modification.FreeMod}>{t('use_free_modification')}</option>
								</select>
							</div>
							<div>
								<button onClick={() => setUseShort((previousState) => !previousState)}>
									{useShort ? t('switch_to_long') : t('switch_to_short')}
								</button>
							</div>
						</div>
						<SearchFilters
							properties={[
								Property.accuracy,
								Property.approach_rate,
								Property.bpm,
								Property.circle_size,
								Property.difficulty_rating,
								Property.last_updated,
								Property.length,
								Property.longest_stream,
								Property.performance_100,
								Property.performance_95,
								Property.ranked_status,
								Property.streams_density,
								Property.streams_length,
								Property.streams_length_type,
								Property.streams_spacing,
								Property.streams_spacing_type
							]}
						/>
					</div>
				</section>
				<section>
					<div>!check / !c</div>
					<div>
						<div>{t('check')}.</div>
						<div id={styles['check']}>
							<div className={styles['copy-input']}>
								<input aria-label={t('language_command')} disabled value={`!check ${beatmapId}`} />
								<button
									aria-label={t('copy_command')}
									onClick={() => navigator.clipboard.writeText(`!check ${beatmapId}`)}
								>
									<FaCopy />
								</button>
							</div>
							<NumericInput size={12} setValue={setBeatmapId} placeholder={t('beatmap_id')} />
						</div>
					</div>
				</section>
				<section>
					<div>/np ({t('osu_only')})</div>
					<div>{t('now_playing')}.</div>
				</section>
				<section>
					<div>!language / !l ({t('osu_only')})</div>
					<div>
						<div>{t('language')}.</div>
						<div id={styles['language']}>
							<div className={styles['copy-input']}>
								<input
									aria-label={t('language_command')}
									disabled
									value={`!language ${userId} ${language}`}
								/>
								<button
									aria-label={t('copy_command')}
									onClick={() => navigator.clipboard.writeText(`!language ${userId} ${language}`)}
								>
									<FaCopy />
								</button>
							</div>
							<NumericInput size={12} setValue={setUserId} placeholder={t('user_id')} />
							<div>
								<select onChange={({ target }) => target.value && setLanguage(target.value)}>
									<option value="">{t('language', { ns: 'common' })}</option>
									<option value="en">English (US)</option>
									<option value="es">Español</option>
									<option value="br">Português (BR)</option>
								</select>
								<span>
									<MdTranslate size={20} />
								</span>
							</div>
						</div>
					</div>
				</section>
				<section>
					<div>!languages</div>
					<div>{t('languages')}.</div>
				</section>
				<section>
					<div>!invite / !i ({t('discord_only')})</div>
					<div>{t('invite')}.</div>
				</section>
				<section>
					<div>!help / !h</div>
					<div>{t('help')}.</div>
				</section>
			</div>
		</FiltersContext.Provider>
	);
}

BotCommands.head = 'bot_commands';

export default BotCommands;

export async function getServerSideProps(
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<ServerSideProps>> {
	return {
		props: {
			...(await serverSideProps(context, ['components/beatmaps', 'pages/commands']))
		}
	};
}

function parseFilters(filters: Filters, modification: Modification, useShort: boolean): string {
	const parameters = [];
	for (const [property, filter] of Object.entries(filters)) {
		const parsedProperty = parseInt(property);
		let parsedFilter = parseProperty(parsedProperty);
		const isBpm = parsedFilter === 'bpm';
		parsedFilter =
			(isBpm ? '' : parsedFilter) + parseValue(parsedProperty, filter, isBpm, useShort);
		if (isBpm) {
			parameters.unshift(parsedFilter);
			continue;
		}
		parameters.push(parsedFilter);
	}
	switch (modification) {
		case Modification.DoubleTime:
			parameters.splice(1, 0, useShort ? 'dt' : 'doubletime');
			break;
		case Modification.FreeMod:
			parameters.splice(1, 0, 'freemod');
			break;
	}
	parameters.unshift(useShort ? '!r' : '!request');
	return parameters.join(' ');
}

function parseProperty(property: Property): string {
	switch (property) {
		case Property.accuracy:
			return 'od';
		case Property.approach_rate:
			return 'ar';
		case Property.bpm:
			return 'bpm';
		case Property.circle_size:
			return 'cs';
		case Property.difficulty_rating:
			return 'stars';
		case Property.last_updated:
			return 'year';
		case Property.length:
			return 'length';
		case Property.longest_stream:
			return 'longest';
		case Property.performance_100:
			return 'pp';
		case Property.performance_95:
			return 'pp95';
		case Property.streams_density:
			return 'density';
		case Property.streams_length:
			return 'average';
		case Property.streams_spacing:
			return 'spacing';
		default:
			return '';
	}
}

function parseValue(property: Property, filter: Filter, isBpm: boolean, useShort: boolean): string {
	let parsedValue = '';
	if (property === Property.favorite_count || property === Property.play_count) return '';
	switch (filter.operator) {
		case Operator.default:
			parsedValue += `${isBpm ? '' : '='}${filter.value[0]}`;
			break;
		case Operator.exact:
			switch (property) {
				case Property.ranked_status:
					parsedValue += useShort
						? RankedStatusShort[filter.value[0]]
						: RankedStatus[filter.value[0]];
					break;
				case Property.streams_length_type:
					parsedValue += useShort
						? AverageTypeShort[filter.value[0]]
						: AverageType[filter.value[0]];
					break;
				case Property.streams_spacing_type:
					parsedValue += useShort
						? SpacingTypeShort[filter.value[0]]
						: SpacingType[filter.value[0]];
					break;
				default:
					parsedValue += `${isBpm ? '' : '='}${filter.value[0]}-`;
					break;
			}
			break;
		case Operator.range:
			parsedValue += `${isBpm ? '' : '='}${filter.value[0]}-${filter.value[1]}`;
			break;
		case Operator.maximum:
			parsedValue += `<${filter.value[0]}`;
			break;
		case Operator.minimum:
			parsedValue += `>${filter.value[0]}`;
			break;
	}
	return parsedValue;
}
