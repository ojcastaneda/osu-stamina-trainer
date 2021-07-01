const commandProcessing = require('../commands/commandsManager');
const authManager = require('../authManager');
const dictionary = require('../dictionary/en.json');
require('dotenv/config');

test('Recognizes base request command', async () => {
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!request 180")).not.toBe(false);
});

test('Recognizes base request command no beatmaps', async () => {
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!request 10")).toBe(dictionary.noBeatmapsFound);
});

test('Recognizes base request command bpm range', async () => {
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!request 180-200")).not.toBe(false);
});

test('Recognizes base request command type', async () => {
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!request 180 type=s")).not.toBe(false);
});

test('Recognizes base request command bpm range and type', async () => {
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!request 180-200 type=s")).not.toBe(false);
});

test('Recognizes help request', async () => {
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!help")).toBe(dictionary.help);
});

test('Recognizes lack of commands', async () => {
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!random")).toBe(dictionary.commandNotFound);
});

test('Recognizes lack of prefix', async () => {
    await authManager.serverTokenRequest();
    expect(await commandProcessing("hello")).toBe(dictionary.commandNoPrefix);
});