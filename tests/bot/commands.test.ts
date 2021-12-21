import dotenv from 'dotenv';
dotenv.config({ path: './.env.development' });
import Database from '../../src/server/models/database';
import commandProcessing from '../../src/bot/commands';
import request from '../../src/bot/request';
import { help, submit, noBeatmapsFound, incorrectFilters, commandNotFound, internalBotError } from '../../src/bot/dictionary';
import filtersProperties from '../../src/bot/filtersProperties.json';

afterAll(Database.$pool.end);

test('Recognizes request command', async () => {
	const possibleErrors = [noBeatmapsFound, incorrectFilters('!request 180'), commandNotFound, internalBotError];
	expect(possibleErrors.includes(await commandProcessing('!request 180'))).toBe(false);
	expect(await commandProcessing('!request 1800 nomod')).toBe(noBeatmapsFound);
});

test('Recognizes submit command', async () => {
	expect(await commandProcessing('!submit')).toBe(submit);
});

test('Recognizes help command', async () => {
	expect(await commandProcessing('!help')).toBe(help);
});

test('Recognizes lack of commands', async () => {
	expect(await commandProcessing('!random')).toBe(commandNotFound);
});

test('Recognizes lack of prefix', async () => {
	expect(await commandProcessing('hello')).toBe(commandNotFound);
});

test('Recognizes bpm command', async () => {
	const filter = filtersProperties.bpm;
	//@ts-ignore
	const defaultValue = await request([`${filter.default}`]);
	//@ts-ignore
	expect(defaultValue.beatmap.bpm <= filter.default + filter.range && defaultValue.beatmap.bpm >= filter.default - filter.range).toBe(true);
	const rangeValues = await request([`${filter.default}-${filter.default + filter.range}`]);
	//@ts-ignore
	expect(rangeValues.beatmap.bpm <= filter.default + filter.range && rangeValues.beatmap.bpm >= filter.default).toBe(true);
	const exactValue = await request([`${filter.default}-`]);
	//@ts-ignore
	expect(exactValue.beatmap.bpm == filter.default).toBe(true);
	const maximumValue = await request([`<${filter.default}`]);
	//@ts-ignore
	expect(maximumValue.beatmap.bpm <= filter.default).toBe(true);
	const minimumValue = await request([`>${filter.default}`]);
	//@ts-ignore
	expect(minimumValue.beatmap.bpm >= filter.default).toBe(true);
	const suggestedValue = await request([`${filter.default + filter.range}bpm`]);
	expect(suggestedValue).toBe(`${filter.default + filter.range}`);
	const suggestedDefaultValue = await request([`bpm`]);
	expect(suggestedDefaultValue).toBe(`${filter.default}`);
	const suggestedOutOfBounds = await request([`${110}`]);
	expect(suggestedOutOfBounds).toBe(`${filter.minimum}`);
});

test('Recognizes numeric commands', async () => {
	//@ts-ignore
	const bpm = `${filtersProperties.bpm.default}`;
	for (const property in filtersProperties) {
		if (property === 'year' || property === 'bpm') continue;
		//@ts-ignore
		const filter = filtersProperties[property];
		//@ts-ignore
		const defaultValue = await request([bpm, `${property}=${filter.default}`]);
		expect(
			//@ts-ignore
			defaultValue.beatmap[property] <= filter.default + filter.range && defaultValue.beatmap[property] >= filter.default - filter.range
		).toBe(true);
		const rangeValues = await request([bpm, `${property}=${filter.default}-${filter.default + filter.range}`]);
		//@ts-ignore
		expect(rangeValues.beatmap[property] <= filter.default + filter.range && rangeValues.beatmap[property] >= filter.default).toBe(true);
		const exactValue = await request([bpm, `${property}=${filter.default}-`]);
		//@ts-ignore
		expect(exactValue.beatmap[property] == filter.default).toBe(true);
		const maximumValue = await request([bpm, `${property}<${filter.default}`]);
		//@ts-ignore
		expect(maximumValue.beatmap[property] <= filter.default).toBe(true);
		const minimumValue = await request([bpm, `${property}>${filter.default}`]);
		//@ts-ignore
		expect(minimumValue.beatmap[property] >= filter.default).toBe(true);
		const suggestedValue = await request([bpm, `${property}=${filter.default + filter.range}${property}`]);
		expect(suggestedValue).toBe(`${bpm} ${property}=${filter.default + filter.range}`);
		const suggestedDefaultValue = await request([bpm, `${property}=${property}`]);
		expect(suggestedDefaultValue).toBe(`${bpm} ${property}=${filter.default}`);
	}
});

test('Recognizes year command', async () => {
	//@ts-ignore
	const bpm = `${filtersProperties.bpm.default}`;
	const filter = filtersProperties.year;
	//@ts-ignore
	const defaultValue = await request([bpm, `year=${filter.default}`]);
	expect(
		//@ts-ignore
		defaultValue.beatmap.last_updated.getFullYear() <= filter.default + 1 && defaultValue.beatmap.last_updated.getFullYear() >= filter.default
	).toBe(true);
	const rangeValues = await request([bpm, `year=${filter.default - 1}-${filter.default + 1}`]);
	expect(
		//@ts-ignore
		rangeValues.beatmap.last_updated.getFullYear() <= filter.default + 1 && rangeValues.beatmap.last_updated.getFullYear() >= filter.default - 1
	).toBe(true);
	const exactValue = await request([bpm, `year=${filter.default}-`]);
	expect(
		//@ts-ignore
		exactValue.beatmap.last_updated.getFullYear() <= filter.default + 1 && defaultValue.beatmap.last_updated.getFullYear() >= filter.default
	).toBe(true);
	const maximumValue = await request([bpm, `year<${filter.default}`]);
	//@ts-ignore
	expect(maximumValue.beatmap.last_updated.getFullYear() <= filter.default).toBe(true);
	const minimumValue = await request([bpm, `year>${filter.default}`]);
	//@ts-ignore
	expect(minimumValue.beatmap.last_updated.getFullYear() >= filter.default).toBe(true);
	const suggestedValue = await request([bpm, `year=${filter.default + filter.range}year`]);
	expect(suggestedValue).toBe(`${bpm} year=${filter.default + filter.range}`);
	const suggestedDefaultValue = await request([bpm, `year=year`]);
	expect(suggestedDefaultValue).toBe(`${bpm} year=${filter.default}`);
	const suggestedOutOfBounds = await request([bpm, `year=${2000}`]);
	expect(suggestedOutOfBounds).toBe(`${bpm} year=${filter.minimum}`);
});

test('Recognizes non numeric commands', async () => {
	//@ts-ignore
	const bpm = `${filtersProperties.bpm.default}`;
	const streamsVariations = [
		{ type: 'bursts', check: (value: number) => value < 9 },
		{ type: 'streams', check: (value: number) => value >= 9 && value < 25 },
		{ type: 'deathstreams', check: (value: number) => value >= 25 }
	];
	for (const variation of streamsVariations) {
		const shortcutValue = await request([bpm, variation.type[0]]);
		//@ts-ignore
		expect(variation.check(shortcutValue.beatmap.average)).toBe(true);
		const fullValue = await request([bpm, variation.type]);
		//@ts-ignore
		expect(variation.check(fullValue.beatmap.average)).toBe(true);
		const suggestedValue = await request([bpm, `${variation.type}1`]);
		expect(suggestedValue).toBe(`${bpm} ${variation.type}`);
	}
	const statusVariations = ['ranked', 'unranked', 'loved'];
	for (const variation of statusVariations) {
		const shortcutValue = await request([bpm, variation[0]]);
		//@ts-ignore
		expect(shortcutValue.beatmap.ranked_status).toBe(variation);
		const fullValue = await request([bpm, variation]);
		//@ts-ignore
		expect(fullValue.beatmap.ranked_status).toBe(variation);
		const suggestedValue = await request([bpm, `${variation}1`]);
		expect(suggestedValue).toBe(`${bpm} ${variation}`);
	}
	//@ts-ignore
	const dtValue = await request([`${filtersProperties.bpm.default * 1.5}-`, 'dt']);
	//@ts-ignore
	expect(dtValue.isDoubleTime && dtValue.beatmap !== undefined && dtValue.beatmap.bpm === filtersProperties.bpm.default * 1.5).toBe(true);
	const nomodValue = await request([`${bpm}-`, 'nomod']);
	//@ts-ignore
	expect(!nomodValue.isDoubleTime && nomodValue.beatmap !== undefined && nomodValue.beatmap.bpm === filtersProperties.bpm.default).toBe(true);
	const nomodSuggestedValue = await request([bpm, 'n']);
	//@ts-ignore
	expect(nomodSuggestedValue).toBe(`${bpm} nomod`);
});

test('Guesses more than one incorrect filter', async () => {
	//@ts-ignore
	const bpm = `${filtersProperties.bpm.default}`;
	const incorrectFilters = await request([bpm, 'n', `ar=${filtersProperties.ar.default}`, `average=${filtersProperties.average.default}adsa`]);
	//@ts-ignore
	expect(incorrectFilters).toBe(`${bpm} nomod ar=${filtersProperties.ar.default} average=${filtersProperties.average.default}`);
});
