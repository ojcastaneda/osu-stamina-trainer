const commandProcessing =  require('../commands/request');
const authManager = require('../authManager');
require('dotenv/config');

test('Recognizes base request command',async ()=>{
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!request 180")).not.toBe(false);
});

test('Recognizes base request command no beatmaps',async ()=>{
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!request 10")).toBe(`No beatmaps available`);
});

test('Recognizes base request command bpm range',async ()=>{
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!request 180-200")).not.toBe(false);
});

test('Recognizes base request command type',async ()=>{
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!request 180 type=s")).not.toBe(false);
});

test('Recognizes base request command bpm range and type',async ()=>{
    await authManager.serverTokenRequest();
    expect(await commandProcessing("!request 180-200 type=s")).not.toBe(false);
});


test('Recognizes base request command stars',async ()=>{
    await authManager.serverTokenRequest();
    expect((await commandProcessing("!request 180 stars=5")).equals(`No beatmaps available`)).toBe(false);
})