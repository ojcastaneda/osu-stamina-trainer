import commandProcessing from '../../src/bot/commands';
import ApiService from '../../src/processing/services/api';
import dictionary from '../../src/bot/dictionary';
import dotenv from 'dotenv';
dotenv.config({path: './.env.development'});

const possibleErrors = [
	dictionary.commandIncorrectParams,
	dictionary.commandNoPrefix,
	dictionary.commandNotFound,
	dictionary.noBeatmapsFound,
	dictionary.serverNotAvailable
];

const apiService = new ApiService();

beforeAll(async () => await apiService.retrieveToken());

test('Recognizes request command', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180', apiService))).toBe(false);
});

test('Recognizes request command no beatmaps', async () => {
	expect(await commandProcessing('!request <129', apiService)).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180-200', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180-', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request <180', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request >180', apiService))).toBe(false);
	expect(await commandProcessing('!request 180bpm', apiService)).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 9000', apiService)).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and AR', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 ar=9', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 ar=9-10', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 ar=9-', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 ar>9', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 ar<9', apiService))).toBe(false);
	expect(await commandProcessing('!request 180 ar=9ar', apiService)).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 ar=15', apiService)).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and average', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 average=16', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 average=16-24', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 average=16-', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 average>16', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 average<16', apiService))).toBe(false);
	expect(await commandProcessing('!request 180 average=9average', apiService)).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 average=9000', apiService)).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and CS', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 cs=4', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 cs=4-5', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 cs=4-', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 cs>4', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 cs<4', apiService))).toBe(false);
	expect(await commandProcessing('!request 180 cs=4cs', apiService)).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 cs=15', apiService)).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and density', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 density=0.5', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 density=0.5-0.6', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 density=0.5-', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 density>0.5', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 density<0.5', apiService))).toBe(false);
	expect(await commandProcessing('!request 180 density=0.5density', apiService)).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 density=2', apiService)).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and length', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 length=180', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 length=180-270', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 length=180-', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 length>180', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 length<180', apiService))).toBe(false);
	expect(await commandProcessing('!request 180 length=90length', apiService)).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 length=9000', apiService)).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and modification', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 270 dt', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 nomod', apiService))).toBe(false);
});

test('Recognizes request command bpm and OD', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 od=9', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 od=9-10', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 od=9-', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 od>9', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 od<9', apiService))).toBe(false);
	expect(await commandProcessing('!request 180 od=9od', apiService)).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 od=15', apiService)).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and stars', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 stars=5', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 stars=5-6', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 stars=5-', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 stars>5', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 stars<5', apiService))).toBe(false);
	expect(await commandProcessing('!request 180 stars=5stars', apiService)).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 stars=9000', apiService)).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and year', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 year=2020', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 year=2020-2021', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 year=2020-', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 year>2020', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 year<2020', apiService))).toBe(false);
	expect(await commandProcessing('!request 180 year=2020year', apiService)).toBe(dictionary.commandIncorrectParams);
	expect(await commandProcessing('!request 180 year=1000', apiService)).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm and status', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 ranked', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 loved', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 unranked', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 r', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 l', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 u', apiService))).toBe(false);
});

test('Recognizes request command bpm and type', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 bursts', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 streams', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 deathstreams', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 b', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 s', apiService))).toBe(false);
	expect(possibleErrors.includes(await commandProcessing('!request 180 d', apiService))).toBe(false);
});

test('Recognizes a combination of request commands', async () => {
	expect(possibleErrors.includes(await commandProcessing('!request 180 nomod s stars=5 ar=9 density=0.5', apiService))).toBe(false);
});

test('Recognizes a combination of request commands on all caps', async () => {
	expect(possibleErrors.includes(await commandProcessing('!REQUEST 180 NOMOD S STARS=5 AR=9 DENSITY=0.5', apiService))).toBe(false);
});

test('Recognizes r command shortcut', async () => {
	expect(possibleErrors.includes(await commandProcessing('!r 180', apiService))).toBe(false);
});

test('Recognizes submit command', async () => {
	expect(await commandProcessing('!submit', apiService)).toBe(dictionary.submit);
});

test('Recognizes help command', async () => {
	expect(await commandProcessing('!help', apiService)).toBe(dictionary.help);
});

test('Recognizes lack of commands', async () => {
	expect(await commandProcessing('!random', apiService)).toBe(dictionary.commandNotFound);
});

test('Recognizes lack of prefix', async () => {
	expect(await commandProcessing('hello', apiService)).toBe(dictionary.commandNoPrefix);
});