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
import { SetStateAction, useEffect, useState } from 'react';
import { FaCopy } from 'react-icons/fa';
import { MdTranslate } from 'react-icons/md';

function BotCommands() {
	const { t } = useTranslation(['pages/commands', 'common']);
	const [filters, setFilters] = useState<Filters>({
		[Property.bpm]: new Filter(Operator.default, [180, 0])
	});
	const [request, setRequest] = useState('');
	const [id, setId] = useState(0);
	const [language, setLanguage] = useState('en');
	const [useShortcut, setUseShortcut] = useState(false);

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
		setRequest(parseFilters(checkedFilters, useShortcut));
	}, [filters, useShortcut]);

	return (
		<FiltersContext.Provider value={[filters, setFiltersCommands]}>
			<div id={styles['bot-commands']}>
				<section>
					<div>!request / !r</div>
					<div>
						<div>{t('request')}.</div>
						<div id={styles['request']}>
							<div className={styles['copy-input']}>
								<input disabled value={request} />
								<button onClick={() => navigator.clipboard.writeText(request)}>
									<FaCopy />
								</button>
							</div>
							<div>
								<button onClick={() => setUseShortcut((previousState) => !previousState)}>
									{useShortcut ? t('use_complete') : t('use_shortcut')}
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
					<div>/np</div>
					<div>{t('now_playing')}.</div>
				</section>
				<section>
					<div>!language / !l</div>
					<div>
						<div>{t('language')}.</div>
						<div id={styles['language']}>
							<div className={styles['copy-input']}>
								<input disabled value={`!language ${id} ${language}`} />
								<button
									onClick={() => navigator.clipboard.writeText(`!language ${id} ${language}`)}
								>
									<FaCopy />
								</button>
							</div>
							<NumericInput
								initialValue={id}
								size={12}
								setValue={setId}
								placeholder={t('user_id')}
							/>
							<div>
								<select onChange={({ target }) => target.value && setLanguage(target.value)}>
									<option value="">{t('language', { ns: 'common' })}</option>
									<option value="en">English</option>
									<option value="es">Español</option>
								</select>
								<span>
									<MdTranslate size={20} />
								</span>
							</div>
						</div>
					</div>
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

function parseFilters(filters: Filters, useShort: boolean): string {
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
