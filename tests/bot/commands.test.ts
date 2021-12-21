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

test('Recognizes submit command', async () => expect(await commandProcessing('!submit')).toBe(submit));

test('Recognizes help command', async () => expect(await commandProcessing('!help')).toBe(help));

test('Recognizes lack of commands', async () => expect(await commandProcessing('!random')).toBe(commandNotFound));

test('Recognizes lack of prefix', async () => expect(await commandProcessing('hello')).toBe(commandNotFound));

test('Recognizes bpm command', async () => {
	const filter = filtersProperties.bpm;
	//@ts-ignore
	const defaultValue = (await request([`${filter.default}`])).beatmap.bpm;
	expect(defaultValue <= filter.default + filter.range && defaultValue >= filter.default - filter.range).toBe(true);
	//@ts-ignore
	const rangeValues = (await request([`${filter.default}-${filter.default + filter.range}`])).beatmap.bpm;
	expect(rangeValues <= filter.default + filter.range && rangeValues >= filter.default).toBe(true);
	//@ts-ignore
	expect((await request([`${filter.default}-`])).beatmap.bpm == filter.default).toBe(true);
	//@ts-ignore
	expect((await request([`<${filter.default}`])).beatmap.bpm <= filter.default).toBe(true);
	//@ts-ignore
	expect((await request([`>${filter.default}`])).beatmap.bpm >= filter.default).toBe(true);
	expect(await commandProcessing(`!r ${filter.default}a`)).toBe(incorrectFilters(`!r ${filter.default}`));
	expect(await commandProcessing('!r z')).toBe(incorrectFilters(`!r ${filter.default}`));
	expect(await commandProcessing('!r 110')).toBe(incorrectFilters(`!r ${filter.minimum}`));
});

test('Recognizes numeric commands', async () => {
	const bpm = `${filtersProperties.bpm.default}`;
	for (const property in filtersProperties) {
		if (property === 'year' || property === 'bpm') continue;
		//@ts-ignore
		const filter = filtersProperties[property];
		//@ts-ignore
		const defaultValue = (await request([bpm, `${property}=${filter.default}`])).beatmap[property];
		expect(defaultValue <= filter.default + filter.range && defaultValue >= filter.default - filter.range).toBe(true);
		//@ts-ignore
		const rangeValues = (await request([bpm, `${property}=${filter.default}-${filter.default + filter.range}`])).beatmap[property];
		expect(rangeValues <= filter.default + filter.range && rangeValues >= filter.default).toBe(true);
		//@ts-ignore
		expect((await request([bpm, `${property}=${filter.default}-`])).beatmap[property] == filter.default).toBe(true);
		//@ts-ignore
		expect((await request([bpm, `${property}<${filter.default}`])).beatmap[property] <= filter.default).toBe(true);
		//@ts-ignore
		expect((await request([bpm, `${property}>${filter.default}`])).beatmap[property] >= filter.default).toBe(true);
		expect(await commandProcessing(`!r ${bpm} ${property}=${filter.default}a`)).toBe(incorrectFilters(`!r ${bpm} ${property}=${filter.default}`));
		if (property !== 'ar')
			expect(await commandProcessing(`!r ${bpm} ${property}a=${filter.default}`)).toBe(
				incorrectFilters(`!r ${bpm} ${property}=${filter.default}`)
			);
		expect(await commandProcessing(`!r ${bpm} ${property}=${property}`)).toBe(incorrectFilters(`!r ${bpm} ${property}=${filter.default}`));
		expect(await commandProcessing(`!r ${property}=${property}`)).toBe(incorrectFilters(`!r ${bpm} ${property}=${filter.default}`));
	}
});

test('Recognizes year command', async () => {
	const bpm = `${filtersProperties.bpm.default}`;
	const filter = filtersProperties.year;
	//@ts-ignore
	const defaultValue = (await request([bpm, `year=${filter.default}`])).beatmap.last_updated.getFullYear();
	expect(defaultValue <= filter.default + 1 && defaultValue >= filter.default).toBe(true);
	//@ts-ignore
	const rangeValues = (await request([bpm, `year=${filter.default - 1}-${filter.default + 1}`])).beatmap.last_updated.getFullYear();
	expect(rangeValues <= filter.default + 1 && rangeValues >= filter.default - 1).toBe(true);
	//@ts-ignore
	const exactValue = (await request([bpm, `year=${filter.default}-`])).beatmap.last_updated.getFullYear();
	expect(exactValue <= filter.default + 1 && exactValue >= filter.default).toBe(true);
	//@ts-ignore
	expect((await request([bpm, `year<${filter.default}`])).beatmap.last_updated.getFullYear() <= filter.default).toBe(true);
	//@ts-ignore
	expect((await request([bpm, `year>${filter.default}`])).beatmap.last_updated.getFullYear() >= filter.default).toBe(true);
	expect(await commandProcessing(`!r ${bpm} year=${filter.default}a`)).toBe(incorrectFilters(`!r ${bpm} year=${filter.default}`));
	expect(await commandProcessing(`!r ${bpm} yeara=${filter.default}`)).toBe(incorrectFilters(`!r ${bpm} year=${filter.default}`));
	expect(await commandProcessing(`!r ${bpm} year=year`)).toBe(incorrectFilters(`!r ${bpm} year=${filter.default}`));
	expect(await commandProcessing(`!r year=year`)).toBe(incorrectFilters(`!r ${bpm} year=${filter.default}`));
	expect(await commandProcessing(`!r ${bpm} year=${2000}`)).toBe(incorrectFilters(`!r ${bpm} year=${filter.minimum}`));
});

test('Recognizes non numeric commands', async () => {
	const bpm = `${filtersProperties.bpm.default}`;
	const streamsVariations = [
		{ type: 'bursts', check: (value: number) => value < 9 },
		{ type: 'streams', check: (value: number) => value >= 9 && value < 25 },
		{ type: 'deathstreams', check: (value: number) => value >= 25 }
	];
	for (const variation of streamsVariations) {
		//@ts-ignore
		expect(variation.check((await request([bpm, variation.type[0]])).beatmap.average)).toBe(true);
		//@ts-ignore
		expect(variation.check((await request([bpm, variation.type])).beatmap.average)).toBe(true);
		expect(await commandProcessing(`!r ${bpm} ${variation.type}a`)).toBe(incorrectFilters(`!r ${bpm} ${variation.type}`));
	}
	for (const variation of ['ranked', 'unranked', 'loved']) {
		//@ts-ignore
		expect((await request([bpm, variation[0]])).beatmap.ranked_status).toBe(variation);
		//@ts-ignore
		expect((await request([bpm, variation])).beatmap.ranked_status).toBe(variation);
		expect(await commandProcessing(`!r ${bpm} ${variation}a`)).toBe(incorrectFilters(`!r ${bpm} ${variation}`));
	}
	const dtValue = await request([`${filtersProperties.bpm.default * 1.5}-`, 'dt']);
	//@ts-ignore
	expect(dtValue.isDoubleTime && dtValue.beatmap !== undefined && dtValue.beatmap.bpm === filtersProperties.bpm.default * 1.5).toBe(true);
	const nomodValue = await request([`${bpm}-`, 'nomod']);
	//@ts-ignore
	expect(!nomodValue.isDoubleTime && nomodValue.beatmap !== undefined && nomodValue.beatmap.bpm === filtersProperties.bpm.default).toBe(true);
	expect(await commandProcessing(`!r ${bpm} n`)).toBe(incorrectFilters(`!r ${bpm} nomod`));
});

test('Guesses more than one incorrect filter', async () => {
	const bpm = `${filtersProperties.bpm.default}`;
	const ar = `${filtersProperties.ar.default}`;
	const average = `${filtersProperties.average.default}`;
	const stars = `${filtersProperties.stars.default}`;
	expect(await commandProcessing(`!r n ar=${ar} average=${average}a star=${stars}-${stars + 1}`)).toBe(
		incorrectFilters(`!r ${bpm} nomod ar=${ar} average=${average} stars=${stars}-${stars + 1}`)
	);
});
