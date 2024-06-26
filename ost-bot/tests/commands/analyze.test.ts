import { Assertion, botTest, expectedTestBeatmap, mockFetch, testBeatmap } from '../setup';

botTest(
	{
		assertions: new Assertion(
			expectedTestBeatmap,
			'is listening to [osu.ppy.sh/beatmapsets/133545#/2766688 Genryuu Kaiko - Nostalgia]'
		),
		bot: 'osu!',
		description: 'Reply to now playing command'
	},
	async (handleMessage) => {
		mockFetch(testBeatmap, `${process.env.API_URL}/api/bot/beatmap/2766688`);
		await handleMessage();
		expect(fetch).toBeCalledWith(`${process.env.API_URL}/api/bot/beatmap/2766688`);
	}
);

botTest(
	{
		assertions: new Assertion(
			expectedTestBeatmap,
			'is listening to [https://osu.ppy.sh/b/1219148 Thaehan - Doki-Doki (BarkingMadDog) [Adrenaline Rush]]'
		),
		bot: 'osu!',
		description: 'Reply to now playing command lazer'
	},
	async (handleMessage) => {
		mockFetch(testBeatmap, `${process.env.API_URL}/api/bot/beatmap/1219148`);
		await handleMessage();
		expect(fetch).toBeCalledWith(`${process.env.API_URL}/api/bot/beatmap/1219148`);
	}
);

botTest(
	{
		assertions: new Assertion(expectedTestBeatmap, '!check 2766688'),
		description: 'Reply to analyze beatmap command'
	},
	async (handleMessage) => {
		mockFetch(testBeatmap, `${process.env.API_URL}/api/bot/beatmap/2766688`);
		await handleMessage();
		expect(fetch).toBeCalledWith(`${process.env.API_URL}/api/bot/beatmap/2766688`);
	}
);

botTest(
	{
		assertions: new Assertion('analysisNotFound', '!check 2766688'),
		description: 'Reply to analyze beatmap command when no beatmap was found'
	},
	async (handleMessage) => {
		mockFetch(404, `${process.env.API_URL}/api/bot/beatmap/2766688`);
		await handleMessage();
		expect(fetch).toBeCalledWith(`${process.env.API_URL}/api/bot/beatmap/2766688`);
	}
);

botTest(
	{
		assertions: [
			new Assertion(['didYouMean', '!check 2766688'], '!check 2766688_'),
			new Assertion(['didYouMean', '!check 2766688'], '!check incorrect')
		],
		description: 'Reply to analyze beatmap command guessing incorrect id'
	},
	(handleMessage) => handleMessage()
);
