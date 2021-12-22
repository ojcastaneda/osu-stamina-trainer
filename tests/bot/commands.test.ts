import dotenv from 'dotenv';
dotenv.config({ path: './.env.development' });
import Database from '../../src/server/models/database';
import commandProcessing from '../../src/bot/commands';
import request from '../../src/bot/request';
import { help, submit, noBeatmapsFound, incorrectFilters, commandNotFound, internalBotError, didYouMean } from '../../src/bot/dictionary';
import filtersProperties from '../../src/bot/filtersProperties.json';

afterAll(Database.$pool.end);

test('Recognizes request command', async () => {
	const possibleErrors = [noBeatmapsFound, incorrectFilters('!request 180'), commandNotFound, internalBotError];
	expect(possibleErrors.includes(await commandProcessing('!request 180'))).toBe(false);
	expect(await commandProcessing('!request 1800 nomod')).toBe(noBeatmapsFound);
	expect(await commandProcessing('!recommend 180')).toBe(didYouMean('!request 180'));
});

test('Recognizes submit command', async () => {
	expect(await commandProcessing('!submit')).toBe(submit);
	expect(await commandProcessing('!submita')).toBe(didYouMean('!submit'));
});

test('Recognizes help command', async () => {
	expect(await commandProcessing('!help')).toBe(help);
	expect(await commandProcessing('!helpa')).toBe(didYouMean('!help'));
});

test('Recognizes lack of commands', async () => expect(await commandProcessing('!a')).toBe(commandNotFound));

test('Recognizes lack of prefix', async () => expect(await commandProcessing('hello')).toBe(commandNotFound));

test('Recognizes bpm command', async () => {
	const { defaultValue, range, minimum } = filtersProperties.bpm;
	//@ts-ignore
	const defaultValues = (await request([`${defaultValue}`])).beatmap.bpm;
	expect(defaultValues <= defaultValue + range && defaultValues >= defaultValue - range).toBe(true);
	//@ts-ignore
	const rangeValues = (await request([`${defaultValue}-${defaultValue + range}`])).beatmap.bpm;
	expect(rangeValues <= defaultValue + range && rangeValues >= defaultValue).toBe(true);
	//@ts-ignore
	expect((await request([`${defaultValue}-`])).beatmap.bpm == defaultValue).toBe(true);
	//@ts-ignore
	expect((await request([`<${defaultValue}`])).beatmap.bpm <= defaultValue).toBe(true);
	//@ts-ignore
	expect((await request([`>${defaultValue}`])).beatmap.bpm >= defaultValue).toBe(true);
	expect(await commandProcessing(`!r ${defaultValue}a`)).toBe(incorrectFilters(`!r ${defaultValue}`));
	expect(await commandProcessing('!r z')).toBe(incorrectFilters(`!r ${defaultValue}`));
	expect(await commandProcessing('!r 110')).toBe(incorrectFilters(`!r ${minimum}`));
	expect(await commandProcessing(`!r ${defaultValue}`)).not.toBe(incorrectFilters(`!r ${defaultValue}`));
});

test('Recognizes numeric commands', async () => {
	const bpm = `${filtersProperties.bpm.defaultValue}`;
	for (const property in filtersProperties) {
		if (property === 'year' || property === 'bpm') continue;
		//@ts-ignore
		const { defaultValue, range } = filtersProperties[property];
		//@ts-ignore
		const defaultValues = (await request([bpm, `${property}=${defaultValue}`])).beatmap[property];
		expect(defaultValues <= defaultValue + range && defaultValues >= defaultValue - range).toBe(true);
		//@ts-ignore
		const rangeValues = (await request([bpm, `${property}=${defaultValue}-${defaultValue + range}`])).beatmap[property];
		expect(rangeValues <= defaultValue + range && rangeValues >= defaultValue).toBe(true);
		//@ts-ignore
		expect((await request([bpm, `${property}=${defaultValue}-`])).beatmap[property] == defaultValue).toBe(true);
		//@ts-ignore
		expect((await request([bpm, `${property}<${defaultValue}`])).beatmap[property] <= defaultValue).toBe(true);
		//@ts-ignore
		expect((await request([bpm, `${property}>${defaultValue}`])).beatmap[property] >= defaultValue).toBe(true);
		expect(await commandProcessing(`!r ${bpm} ${property}=${defaultValue}a`)).toBe(incorrectFilters(`!r ${bpm} ${property}=${defaultValue}`));
		if (property !== 'ar')
			expect(await commandProcessing(`!r ${bpm} ${property}a=${defaultValue}`)).toBe(incorrectFilters(`!r ${bpm} ${property}=${defaultValue}`));
		expect(await commandProcessing(`!r ${bpm} ${property}=${property}`)).toBe(incorrectFilters(`!r ${bpm} ${property}=${defaultValue}`));
		expect(await commandProcessing(`!r ${property}=${property}`)).toBe(incorrectFilters(`!r ${bpm} ${property}=${defaultValue}`));
		expect(await commandProcessing(`!r ${bpm} ${property}=${defaultValue}`)).not.toBe(incorrectFilters(`!r ${bpm} ${property}=${defaultValue}`));
	}
});

test('Recognizes year command', async () => {
	const bpm = `${filtersProperties.bpm.defaultValue}`;
	const { defaultValue, minimum } = filtersProperties.year;
	//@ts-ignore
	const defaultValues = (await request([bpm, `year=${defaultValue}`])).beatmap.last_updated.getFullYear();
	expect(defaultValues <= defaultValue + 1 && defaultValues >= defaultValue).toBe(true);
	//@ts-ignore
	const rangeValues = (await request([bpm, `year=${defaultValue - 1}-${defaultValue + 1}`])).beatmap.last_updated.getFullYear();
	expect(rangeValues <= defaultValue + 1 && rangeValues >= defaultValue - 1).toBe(true);
	//@ts-ignore
	const exactValue = (await request([bpm, `year=${defaultValue}-`])).beatmap.last_updated.getFullYear();
	expect(exactValue <= defaultValue + 1 && exactValue >= defaultValue).toBe(true);
	//@ts-ignore
	expect((await request([bpm, `year<${defaultValue}`])).beatmap.last_updated.getFullYear() <= defaultValue).toBe(true);
	//@ts-ignore
	expect((await request([bpm, `year>${defaultValue}`])).beatmap.last_updated.getFullYear() >= defaultValue).toBe(true);
	expect(await commandProcessing(`!r ${bpm} year=${defaultValue}a`)).toBe(incorrectFilters(`!r ${bpm} year=${defaultValue}`));
	expect(await commandProcessing(`!r ${bpm} yeara=${defaultValue}`)).toBe(incorrectFilters(`!r ${bpm} year=${defaultValue}`));
	expect(await commandProcessing(`!r ${bpm} year=year`)).toBe(incorrectFilters(`!r ${bpm} year=${defaultValue}`));
	expect(await commandProcessing(`!r year=year`)).toBe(incorrectFilters(`!r ${bpm} year=${defaultValue}`));
	expect(await commandProcessing(`!r ${bpm} year=${2000}`)).toBe(incorrectFilters(`!r ${bpm} year=${minimum}`));
	expect(await commandProcessing(`!r ${bpm} year=${defaultValue}`)).not.toBe(incorrectFilters(`!r ${bpm} year=${defaultValue}`));
});

test('Recognizes non numeric commands', async () => {
	const bpm = `${filtersProperties.bpm.defaultValue}`;
	const streamsVariations = [
		{ type: 'bursts', check: (value: number) => value < 9 },
		{ type: 'streams', check: (value: number) => value >= 9 && value < 25 },
		{ type: 'deathstreams', check: (value: number) => value >= 25 }
	];
	for (const { type, check } of streamsVariations) {
		//@ts-ignore
		expect(check((await request([bpm, type[0]])).beatmap.average)).toBe(true);
		//@ts-ignore
		expect(check((await request([bpm, type])).beatmap.average)).toBe(true);
		expect(await commandProcessing(`!r ${bpm} ${type}a`)).toBe(incorrectFilters(`!r ${bpm} ${type}`));
		expect(await commandProcessing(`!r ${bpm} ${type}`)).not.toBe(incorrectFilters(`!r ${bpm} ${type}`));
		expect(await commandProcessing(`!r ${bpm} type=${type}`)).toBe(incorrectFilters(`!r ${bpm} ${type}`));
	}
	for (const variation of ['ranked', 'unranked', 'loved']) {
		//@ts-ignore
		expect((await request([bpm, variation[0]])).beatmap.ranked_status).toBe(variation);
		//@ts-ignore
		expect((await request([bpm, variation])).beatmap.ranked_status).toBe(variation);
		expect(await commandProcessing(`!r ${bpm} ${variation}a`)).toBe(incorrectFilters(`!r ${bpm} ${variation}`));
		expect(await commandProcessing(`!r ${bpm} ${variation}`)).not.toBe(incorrectFilters(`!r ${bpm} ${variation}`));
	}
	const dtValue = await request([`${filtersProperties.bpm.defaultValue * 1.5}-`, 'dt']);
	//@ts-ignore
	expect(dtValue.isDoubleTime && dtValue.beatmap !== undefined && dtValue.beatmap.bpm === filtersProperties.bpm.defaultValue * 1.5).toBe(true);
	expect(await commandProcessing(`!r ${bpm} dt`)).not.toBe(incorrectFilters(`!r ${bpm} dt`));
	const nomodValue = await request([`${bpm}-`, 'nomod']);
	//@ts-ignore
	expect(!nomodValue.isDoubleTime && nomodValue.beatmap !== undefined && nomodValue.beatmap.bpm === filtersProperties.bpm.defaultValue).toBe(true);
	expect(await commandProcessing(`!r ${bpm} nomoda`)).toBe(incorrectFilters(`!r ${bpm} nomod`));
	expect(await commandProcessing(`!r ${bpm} nomod`)).not.toBe(incorrectFilters(`!r ${bpm} nomod`));
});

test('Guesses more than one incorrect filter', async () => {
	const bpm = `${filtersProperties.bpm.defaultValue}`;
	const ar = `${filtersProperties.ar.defaultValue}`;
	const average = `${filtersProperties.average.defaultValue}`;
	const stars = `${filtersProperties.stars.defaultValue}`;
	expect(await commandProcessing(`!r n ar=${ar} average=${average}a star=${stars}-${stars + 1}`)).toBe(
		incorrectFilters(`!r ${bpm} nomod ar=${ar} average=${average} stars=${stars}-${stars + 1}`)
	);
});
