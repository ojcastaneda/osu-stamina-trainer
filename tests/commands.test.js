const commandProcessing = require('../commands/commandsManager');
const authManager = require('../authManager');
const dictionary = require('../dictionary');
require('dotenv/config');

beforeAll(async () => {
    return await authManager.serverTokenRequest();
});

test('Recognizes request command', async () => {
    expect(await commandProcessing("!request 180")).not.toBe(false);
});

test('Recognizes request command no beatmaps', async () => {
    expect(await commandProcessing("!request 10")).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes request command bpm', async () => {
    expect(await commandProcessing("!request 180")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm range', async () => {
    expect(await commandProcessing("!request 180-200")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180-200")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180-200")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180-200")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180-200")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm exact', async () => {
    expect(await commandProcessing("!request 180-")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180-")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180-")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180-")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180-")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and type bursts', async () => {
    expect(await commandProcessing("!request 180 b")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 b")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 b")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 b")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 b")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and type streams', async () => {
    expect(await commandProcessing("!request 180 s")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 s")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 s")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 s")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 s")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and type deathstreams', async () => {
    expect(await commandProcessing("!request 180 d")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 d")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 d")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 d")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 d")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and status ranked', async () => {
    expect(await commandProcessing("!request 180 r")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 r")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 r")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 r")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 r")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and status loved', async () => {
    expect(await commandProcessing("!request 180 l")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 l")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 l")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 l")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 l")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and status unranked', async () => {
    expect(await commandProcessing("!request 260 u")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 260 u")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 260 u")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 260 u")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 260 u")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and stars', async () => {
    expect(await commandProcessing("!request 180 stars=5.5")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 stars=5.5")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 stars=5.5")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 stars=5.5")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 stars=5.5")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and stars range', async () => {
    expect(await commandProcessing("!request 180 stars=5-6")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 stars=5-6")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 stars=5-6")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 stars=5-6")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 stars=5-6")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and stars exact', async () => {
    expect(await commandProcessing("!request 180 stars=5-")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 stars=5-")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 stars=5-")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 stars=5-")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 stars=5-")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and ar', async () => {
    expect(await commandProcessing("!request 180 ar=9")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 ar=9")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 ar=9")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 ar=9")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 ar=9")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and ar range', async () => {
    expect(await commandProcessing("!request 180 ar=9-10")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 ar=9-10")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 ar=9-10")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 ar=9-10")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 ar=9-10")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and ar exact', async () => {
    expect(await commandProcessing("!request 180 ar=9-")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 ar=9-")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 ar=9-")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 ar=9-")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 ar=9-")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and density', async () => {
    expect(await commandProcessing("!request 180 density=0.4")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 density=0.4")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 density=0.4")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 density=0.4")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 density=0.4")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and density range', async () => {
    expect(await commandProcessing("!request 180 density=0.3-0.6")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 density=0.3-0.6")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 density=0.3-0.6")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 density=0.3-0.6")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 density=0.3-0.6")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and density exact', async () => {
    expect(await commandProcessing("!request 180 density=0.32-")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 density=0.32-")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 density=0.32-")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 density=0.32-")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 density=0.32-")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and mod dt', async () => {
    expect(await commandProcessing("!request 270 dt")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 270 dt")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 270 dt")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 270 dt")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 270 dt")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and mod nomod', async () => {
    expect(await commandProcessing("!request 180 nomod")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 nomod")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 nomod")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 nomod")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 nomod")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and length', async () => {
    expect(await commandProcessing("!request 180 length=90")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 length=90")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 length=90")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 length=90")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 length=90")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and length range', async () => {
    expect(await commandProcessing("!request 180 length=90-120")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 length=90-120")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 length=90-120")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 length=90-120")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 length=90-120")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and length exact', async () => {
    expect(await commandProcessing("!request 180 length=90-")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 length=90-")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 length=90-")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 length=90-")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 length=90-")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and cs', async () => {
    expect(await commandProcessing("!request 180 cs=4")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 cs=4")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 cs=4")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 cs=4")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 cs=4")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and cs range', async () => {
    expect(await commandProcessing("!request 180 cs=4-5")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 cs=4-5")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 cs=4-5")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 cs=4-5")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 cs=4-5")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and length exact', async () => {
    expect(await commandProcessing("!request 180 cs=4-")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 cs=4-")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 cs=4-")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 cs=4-")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 cs=4-")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and od', async () => {
    expect(await commandProcessing("!request 180 od=9")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 od=9")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 od=9")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 od=9")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 od=9")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and od range', async () => {
    expect(await commandProcessing("!request 180 od=9-10")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 od=9-10")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 od=9-10")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 od=9-10")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 od=9-10")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and od exact', async () => {
    expect(await commandProcessing("!request 180 od=9-")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 od=9-")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 od=9-")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 od=9-")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 od=9-")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and average', async () => {
    expect(await commandProcessing("!request 180 average=8")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 average=8")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 average=8")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 average=8")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 average=8")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and average range', async () => {
    expect(await commandProcessing("!request 180 average=8-16")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 average=8-16")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 average=8-16")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 average=8-16")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 average=8-16")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm and average exact', async () => {
    expect(await commandProcessing("!request 180 average=8-")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 average=8-")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 average=8-")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 average=8-")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 average=8-")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm, type, stars, ar and density', async () => {
    expect(await commandProcessing("!request 180 s stars=5.5 ar=9.5 density=0.4")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!request 180 s stars=5.5 ar=9.5 density=0.4")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!request 180 s stars=5.5 ar=9.5 density=0.4")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!request 180 s stars=5.5 ar=9.5 density=0.4")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!request 180 s stars=5.5 ar=9.5 density=0.4")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes request command bpm, type, stars, ar and density on all caps', async () => {
    expect(await commandProcessing("!REQUEST 180 S STARS=5.5 AR=9.5 DENSITY=0.4")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!REQUEST 180 S STARS=5.5 AR=9.5 DENSITY=0.4")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!REQUEST 180 S STARS=5.5 AR=9.5 DENSITY=0.4")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!REQUEST 180 S STARS=5.5 AR=9.5 DENSITY=0.4")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!REQUEST 180 S STARS=5.5 AR=9.5 DENSITY=0.4")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes r command shortcut', async () => {
    expect(await commandProcessing("!r 180")).not.toBe(dictionary.commandIncorrectParams);
    expect(await commandProcessing("!r 180")).not.toBe(dictionary.commandNoPrefix);
    expect(await commandProcessing("!r 180")).not.toBe(dictionary.commandNotFound);
    expect(await commandProcessing("!r 180")).not.toBe(dictionary.noBeatmapsFound);
    expect(await commandProcessing("!r 180")).not.toBe(dictionary.serverNotAvailable);
});

test('Recognizes submit command', async () => {
    expect(await commandProcessing("!submit")).toBe(dictionary.submit);
});

test('Recognizes help command', async () => {
    expect(await commandProcessing("!help")).toBe(dictionary.help);
});

test('Recognizes lack of commands', async () => {
    expect(await commandProcessing("!random")).toBe(dictionary.commandNotFound);
});

test('Recognizes lack of prefix', async () => {
    expect(await commandProcessing("hello")).toBe(dictionary.commandNoPrefix);
});