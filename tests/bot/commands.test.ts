import dotenv from 'dotenv';
dotenv.config({ path: './.env.development' });
import Database from '../../src/server/models/database';
import commandProcessing from '../../src/bot/commands';
import dictionary from '../../src/bot/dictionary';

const possibleErrors = [
	dictionary.commandIncorrectParams,
	dictionary.commandNoPrefix,
	dictionary.commandNotFound,
	dictionary.noBeatmapsFound,
	dictionary.serverNotAvailable
];

afterAll(Database.$pool.end);

test('Recognizes request command', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180'))).toBe(false);
});

test('Recognizes request command no beatmaps', async () => {
	expect(await commandProcessing('!request <129')).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180-200'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180-'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request <180'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request >180'))).toBe(false);
	expect(await commandProcessing('!request 180bpm')).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 9000')).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and AR', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 ar=9'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 ar=9-10'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 ar=9-'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 ar>9'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 ar<9'))).toBe(false);
	expect(await commandProcessing('!request 180 ar=9ar')).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 ar=15')).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and average', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 average=16'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 average=16-24'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 average=16-'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 average>16'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 average<16'))).toBe(false);
	expect(await commandProcessing('!request 180 average=9average')).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 average=9000')).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and CS', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 cs=4'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 cs=4-5'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 cs=4-'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 cs>4'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 cs<4'))).toBe(false);
	expect(await commandProcessing('!request 180 cs=4cs')).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 cs=15')).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and density', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 density=0.5'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 density=0.5-0.6'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 density=0.5-'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 density>0.5'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 density<0.5'))).toBe(false);
	expect(await commandProcessing('!request 180 density=0.5density')).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 density=2')).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and length', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 length=180'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 length=180-270'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 length=180-'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 length>180'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 length<180'))).toBe(false);
	expect(await commandProcessing('!request 180 length=90length')).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 length=9000')).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and modification', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 270 dt'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 nomod'))).toBe(false);
});

test('Recognizes request command bpm and OD', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 od=9'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 od=9-10'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 od=9-'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 od>9'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 od<9'))).toBe(false);
	expect(await commandProcessing('!request 180 od=9od')).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 od=15')).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and stars', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 stars=5'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 stars=5-6'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 stars=5-'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 stars>5'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 stars<5'))).toBe(false);
	expect(await commandProcessing('!request 180 stars=5stars')).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 stars=9000')).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and year', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 year=2020'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 year=2020-2021'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 year=2020-'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 year>2020'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 year<2020'))).toBe(false);
	expect(await commandProcessing('!request 180 year=2020year')).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 year=1000')).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and status', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 ranked'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 loved'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 unranked'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 r'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 l'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 u'))).toBe(false);
});

test('Recognizes request command bpm and type', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 bursts'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 streams'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 deathstreams'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 b'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 s'))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 d'))).toBe(false);
});

test('Recognizes a combination of request commands', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 nomod s stars=5 ar=9 density=0.5'))).toBe(false);
});

test('Recognizes a combination of request commands on all caps', async () => {
	expect(possibleErrors.includes(await commandProcessing('!REQUEST 180 NOMOD S STARS=5 AR=9 DENSITY=0.5'))).toBe(false);
});

test('Recognizes r command shortcut', async () => {
	expect(possibleErrors.includes(await commandProcessing('!r 180'))).toBe(false);
});

test('Recognizes submit command', async () => {
	expect(await commandProcessing('!submit')).toBe(dictionary.submit);
});

test('Recognizes help command', async () => {
	expect(await commandProcessing('!help')).toBe(dictionary.help);
});

test('Recognizes lack of commands', async () => {
	expect(await commandProcessing('!random')).toBe(dictionary.commandNotFound);
});

test('Recognizes lack of prefix', async () => {
	expect(await commandProcessing('hello')).toBe(dictionary.commandNoPrefix);
});
