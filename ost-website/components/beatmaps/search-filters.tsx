import NumericInput from '@components/numeric-input';
import { parseProperty, RankedStatus } from '@models/beatmap';
import {
	AverageType,
	Filter as BotFilter,
	FiltersContext,
	Operator,
	Property,
	SpacingType
} from '@models/botFilter';
import styles from '@styles/components/beatmaps/search-filters.module.scss';
import { useTranslation } from 'next-i18next';
import { ChangeEvent, FormEvent, ReactElement, useCallback, useContext } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { FaMinus, FaQuestion } from 'react-icons/fa';

interface SearchFiltersProps {
	allowCollapse?: boolean;
	properties: Property[];
}

export default function SearchFilters({ allowCollapse = false, properties }: SearchFiltersProps) {
	const { t } = useTranslation('components/beatmaps');
	const [expanded, setExpanded] = useState(false);
	const [filters, setFilters] = useContext(FiltersContext);
	const [activeFilters, setActiveFilters] = useState<ReactElement[]>([]);
	const [availableFilters, setAvailableFilters] = useState<ReactElement[]>([]);

	function addFilter({ target }: ChangeEvent<HTMLSelectElement>) {
		const property = parseInt(target.value);
		if (isNaN(property)) return;
		target.value = '';
		setFilters({
			...filters,
			[property]: new BotFilter(
				property === Property.ranked_status ||
				property === Property.streams_length_type ||
				property === Property.streams_spacing_type
					? Operator.exact
					: Operator.default,
				[0, 0]
			)
		});
	}

	const setFilter = useCallback(
		function (property: Property, filter: BotFilter | undefined) {
			setFilters((previousFilters) => {
				if (filter !== undefined) return { ...previousFilters, [property]: filter };
				delete previousFilters[property];
				return { ...previousFilters };
			});
		},
		[setFilters]
	);

	useEffect(() => {
		const newActiveFilters = [];
		const newAvailableFilters = [];
		for (const property of properties) {
			const filter = filters[property];
			if (filter === undefined) {
				newAvailableFilters.push(
					<option key={`filter-property=${property}`} value={property}>
						{t(Property[property])}
					</option>
				);
				continue;
			}
			newActiveFilters.push(
				<Filter
					filter={filter}
					key={`filter=${property}`}
					property={property}
					setFilter={(filter) => setFilter(property, filter)}
				/>
			);
		}
		setActiveFilters(newActiveFilters);
		setAvailableFilters(newAvailableFilters);
	}, [filters, setFilter, t, properties]);

	return expanded || !allowCollapse ? (
		<>
			<div className={styles['filters']}>
				<table>
					<tbody>{activeFilters}</tbody>
				</table>
				{availableFilters && availableFilters.length > 0 && (
					<select onChange={addFilter}>
						<option value="">{t('add_filter')}</option>
						{availableFilters}
					</select>
				)}
			</div>
			{allowCollapse && (
				<span id={styles['settings']} onClick={() => setExpanded(false)}>
					{t('hide_settings')}
				</span>
			)}
		</>
	) : (
		<span id={styles['settings']} onClick={() => setExpanded(true)}>
			{t('show_settings')}
		</span>
	);
}

interface FilterProps {
	filter: BotFilter;
	property: Property;
	setFilter: (filter: BotFilter | undefined) => void;
}

function Filter({ filter, property, setFilter }: FilterProps) {
	const { t } = useTranslation('components/beatmaps');
	const [expanded, setExpanded] = useState<boolean>(false);
	const [inputs, setInputs] = useState<ReactElement[]>([]);

	const changeValue = useCallback(
		function (value: number, index = 0) {
			setFilter(
				new BotFilter(
					filter.operator,
					index === 0 ? [value, filter.value[1]] : [filter.value[0], value]
				)
			);
		},
		[filter.operator, filter.value, setFilter]
	);

	const changeOperator = useCallback(
		function ({ target }: FormEvent<HTMLSelectElement>) {
			setFilter(new BotFilter(parseInt((target as HTMLInputElement).value), filter.value));
		},
		[filter.value, setFilter]
	);

	useEffect(() => {
		const newInputs = [];

		if (
			property !== Property.streams_length_type &&
			property !== Property.streams_spacing_type &&
			property !== Property.ranked_status
		) {
			newInputs.push(
				<select onInput={changeOperator} value={filter.operator}>
					<option value={Operator.exact}>{t(Operator[Operator.exact])}</option>
					<option value={Operator.default}>{t(Operator[Operator.default])}</option>
					<option value={Operator.maximum}>{t(Operator[Operator.maximum])}</option>
					<option value={Operator.minimum}>{t(Operator[Operator.minimum])}</option>
					<option value={Operator.range}>{t(Operator[Operator.range])}</option>
				</select>
			);
		}
		switch (filter.operator) {
			case Operator.default:
				newInputs.push(
					<NumericInput
						initialValue={filter.value[0]}
						setValue={changeValue}
						placeholder={t('default')}
					/>
				);
				newInputs.push(
					<input
						aria-label={t('default_range')}
						disabled
						maxLength={7}
						size={6}
						value={`+/- ${parseProperty(property)[1]}`}
					/>
				);
				return setInputs(newInputs);
			case Operator.maximum:
				newInputs.push(
					<NumericInput
						initialValue={filter.value[0]}
						setValue={changeValue}
						placeholder={t('maximum')}
					/>
				);
				return setInputs(newInputs);
			case Operator.minimum:
				newInputs.push(
					<NumericInput
						initialValue={filter.value[0]}
						setValue={changeValue}
						placeholder={t('minimum')}
					/>
				);
				return setInputs(newInputs);
			case Operator.range:
				newInputs.push(
					<NumericInput
						initialValue={filter.value[0]}
						setValue={changeValue}
						placeholder={t('minimum')}
					/>
				);
				newInputs.push(
					<NumericInput
						initialValue={filter.value[1]}
						setValue={(value) => changeValue(value, 1)}
						placeholder={t('maximum')}
					/>
				);
				return setInputs(newInputs);
		}
		switch (property) {
			case Property.streams_length_type:
				newInputs.push(
					<select
						onChange={({ target }) => changeValue(parseInt(target.value))}
						value={filter.value[0]}
					>
						<option value={AverageType.bursts}>{t(AverageType[AverageType.bursts])}</option>
						<option value={AverageType.streams}>{t(AverageType[AverageType.streams])}</option>
						<option value={AverageType.deathstreams}>
							{t(AverageType[AverageType.deathstreams])}
						</option>
					</select>
				);
				break;
			case Property.ranked_status:
				newInputs.push(
					<select
						onChange={({ target }) => changeValue(parseInt(target.value))}
						value={filter.value[0]}
					>
						<option value={RankedStatus.loved}>{t(RankedStatus[RankedStatus.loved])}</option>
						<option value={RankedStatus.ranked}>{t(RankedStatus[RankedStatus.ranked])}</option>
						<option value={RankedStatus.unranked}>{t(RankedStatus[RankedStatus.unranked])}</option>
					</select>
				);
				break;
			case Property.streams_spacing_type:
				newInputs.push(
					<select
						onChange={({ target }) => changeValue(parseInt(target.value))}
						value={filter.value[0]}
					>
						<option value={SpacingType.stacked}>{t(SpacingType[SpacingType.stacked])}</option>
						<option value={SpacingType.spaced}>{t(SpacingType[SpacingType.spaced])}</option>
						<option value={SpacingType.alternate}>{t(SpacingType[SpacingType.alternate])}</option>
					</select>
				);
				break;
			default:
				newInputs.push(
					<NumericInput
						initialValue={filter.value[0]}
						setValue={changeValue}
						placeholder={t('exact')}
					/>
				);
				break;
		}
		setInputs(newInputs);
	}, [changeOperator, changeValue, filter.operator, filter.value, property, t]);

	return (
		<tr className={styles['filter']}>
			<td className={styles['filter-property']}>
				<div>
					<span onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
						<FaQuestion size={15} />
					</span>
					<div>{t(Property[property])}</div>
				</div>
				<span hidden={!expanded}>{t(`${Property[property]}_definition`)}</span>
			</td>
			{inputs.map((input, index) => {
				const key = `${property}-input=${index}`;
				let colSpan = 1;
				if (inputs.length === 1) colSpan = 3;
				else if (inputs.length === 2 && index === 1) colSpan = 2;
				return (
					<td colSpan={colSpan} key={key}>
						{input}
					</td>
				);
			})}
			<td>
				<button aria-label={t('remove_filter')} onClick={() => setFilter(undefined)}>
					<FaMinus size={15} />
				</button>
			</td>
		</tr>
	);
}
