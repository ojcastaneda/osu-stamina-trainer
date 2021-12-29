import dotenv from 'dotenv';

dotenv.config({path: './.env.development'});
import Database from '../../src/server/models/database';
import commandProcessing from '../../src/bot/commands';
import request from '../../src/bot/request/request';
import {help, submit, noBeatmapsFound, incorrectFilters, commandNotFound, internalBotError, didYouMean} from '../../src/bot/dictionary';
import {BeatmapRequest} from '../../src/server/logic/bot/beatmaps';
import {filters} from '../../src/bot/request/models';
import Beatmap from '../../src/server/models/beatmap';

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
	const {defaultValue, range, minimum} = filters.bpm!;
	const defaultValues = ((await request([`${defaultValue}`])) as BeatmapRequest).beatmap!.bpm!;
	expect(defaultValues <= defaultValue + range && defaultValues >= defaultValue - range).toBe(true);
	const rangeValues = ((await request([`${defaultValue}-${defaultValue + range}`])) as BeatmapRequest).beatmap!.bpm!;
	expect(rangeValues <= defaultValue + range && rangeValues >= defaultValue).toBe(true);
	expect(((await request([`${defaultValue}-`])) as BeatmapRequest).beatmap!.bpm! == defaultValue).toBe(true);
	expect(((await request([`<${defaultValue}`])) as BeatmapRequest).beatmap!.bpm! <= defaultValue).toBe(true);
	expect(((await request([`>${defaultValue}`])) as BeatmapRequest).beatmap!.bpm! >= defaultValue).toBe(true);
	expect(await commandProcessing(`!r ${defaultValue}a`)).toBe(incorrectFilters(`!r ${defaultValue}`));
	expect(await commandProcessing('!r z')).toBe(incorrectFilters(`!r ${defaultValue}`));
	expect(await commandProcessing('!r 110')).toBe(incorrectFilters(`!r ${minimum}`));
	expect(await commandProcessing(`!r ${defaultValue}`)).not.toBe(incorrectFilters(`!r ${defaultValue}`));
});

test('Recognizes non numeric commands', async () => {
	const bpm = `${filters.bpm!.defaultValue}`;
	const streamsVariations = [{type: 'bursts', check: (value: number) => value < 9},
		{type: 'streams', check: (value: number) => value >= 9 && value < 25}, {type: 'deathstreams', check: (value: number) => value >= 25}];
	for (const {type, check} of streamsVariations) {
		expect(check(((await request([bpm, type[0]])) as BeatmapRequest).beatmap!.stream_length!)).toBe(true);
		expect(check(((await request([bpm, type])) as BeatmapRequest).beatmap!.stream_length!)).toBe(true);
		expect(await commandProcessing(`!r ${bpm} ${type}a`)).toBe(incorrectFilters(`!r ${bpm} ${type}`));
		expect(await commandProcessing(`!r ${bpm} ${type}`)).not.toBe(incorrectFilters(`!r ${bpm} ${type}`));
		expect(await commandProcessing(`!r ${bpm} type=${type}`)).toBe(incorrectFilters(`!r ${bpm} ${type}`));
	}
	for (const variation of ['ranked', 'unranked', 'loved']) {
		expect(((await request([bpm, variation[0]])) as BeatmapRequest).beatmap!.ranked!).toBe(variation);
		expect(((await request([bpm, variation])) as BeatmapRequest).beatmap!.ranked!).toBe(variation);
		expect(await commandProcessing(`!r ${bpm} ${variation}a`)).toBe(incorrectFilters(`!r ${bpm} ${variation}`));
		expect(await commandProcessing(`!r ${bpm} ${variation}`)).not.toBe(incorrectFilters(`!r ${bpm} ${variation}`));
	}
	const dtValue = ((await request([`${filters.bpm!.defaultValue * 1.5}-`, 'dt'])) as BeatmapRequest);
	expect(dtValue.isDoubleTime && dtValue.beatmap !== undefined && dtValue.beatmap.bpm === filters.bpm!.defaultValue * 1.5).toBe(true);
	expect(await commandProcessing(`!r ${bpm} dt`)).not.toBe(incorrectFilters(`!r ${bpm} dt`));
	const nomodValue = ((await request([`${bpm}-`, 'nomod'])) as BeatmapRequest);
	expect(!nomodValue.isDoubleTime && nomodValue.beatmap! !== undefined && nomodValue.beatmap!.bpm === filters.bpm!.defaultValue).toBe(true);
	expect(await commandProcessing(`!r ${bpm} nomoda`)).toBe(incorrectFilters(`!r ${bpm} nomod`));
	expect(await commandProcessing(`!r ${bpm} nomod`)).not.toBe(incorrectFilters(`!r ${bpm} nomod`));
});

test('Guesses more than one incorrect filter', async () => {
	const bpm = `${filters.bpm!.defaultValue}`;
	const ar = `${filters.ar!.defaultValue}`;
	const average = `${filters.stream_length!.defaultValue}`;
	const stars = `${filters.difficulty_rating!.defaultValue}`;
	expect(await commandProcessing(`!r n ar=${ar} average=${average}a star=${stars}-${stars + 1}`)).
		toBe(incorrectFilters(`!r ${bpm} nomod ar=${ar} average=${average} stars=${stars}-${stars + 1}`));
});

test('Recognizes numeric commands', async () => {
	const bpm = `${(filters.bpm!).defaultValue}`;
	for (const key in filters) {
		const propertyKey = key as (keyof Beatmap);
		if (filters[propertyKey] === undefined || propertyKey === 'bpm') continue;
		const {defaultValue, range, property} = filters[propertyKey]!;
		const defaultValues = await checkIsYear(propertyKey, [bpm, `${property}=${defaultValue}`]);
		expect(defaultValues <= defaultValue + range && defaultValues >= defaultValue - range).toBe(true);
		const rangeValues = await checkIsYear(propertyKey, [bpm, `${property}=${defaultValue}-${defaultValue + range}`]);
		expect(rangeValues <= defaultValue + range && rangeValues >= defaultValue).toBe(true);
		expect((await checkIsYear(propertyKey, [bpm, `${property}=${defaultValue}-`])) == defaultValue).toBe(true);
		expect((await checkIsYear(propertyKey, [bpm, `${property}<${defaultValue}`])) <= defaultValue).toBe(true);
		expect((await checkIsYear(propertyKey, [bpm, `${property}>${defaultValue}`])) >= defaultValue).toBe(true);
		if (property !== 'ar') {
			expect(await commandProcessing(`!r ${bpm} ${property}a=${defaultValue}`)).
				toBe(incorrectFilters(`!r ${bpm} ${property}=${defaultValue}`));
		}
		expect(await commandProcessing(`!r ${bpm} ${property}=${defaultValue}a`)).toBe(incorrectFilters(`!r ${bpm} ${property}=${defaultValue}`));
		expect(await commandProcessing(`!r ${bpm} ${property}=${property}`)).toBe(incorrectFilters(`!r ${bpm} ${property}=${defaultValue}`));
		expect(await commandProcessing(`!r ${property}=${property}`)).toBe(incorrectFilters(`!r ${bpm} ${property}=${defaultValue}`));
		expect(await commandProcessing(`!r ${bpm} ${property}=${defaultValue}`)).not.toBe(incorrectFilters(`!r ${bpm} ${property}=${defaultValue}`));
	}
});

const checkIsYear = async (propertyKey: (keyof Beatmap), rawFilters: string[]): Promise<number> => {
	const result = ((await request(rawFilters)) as BeatmapRequest).beatmap![propertyKey]!;
	if (typeof result === 'number') {return result;}
	return propertyKey === 'last_updated' ? (result as Date).getFullYear() : -1;
};
