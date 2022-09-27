import { Languages, languages } from '../../src/osu/formatter';
import { Assertion, botTest, mockFetch } from '../setup';

botTest(
	{
		assertions: new Assertion('availableLanguages', '!languages'),
		bot: 'osu!',
		description: 'Reply to update available languages command'
	},
	async (handleMessage) => handleMessage()
);

botTest<Languages>(
	{
		assertions: Object.keys(languages).map(
			(language) =>
				new Assertion(
					['languageUpdate', language],
					`!language 6484647 ${language}`,
					language,
					language
				)
		),
		bot: 'osu!',
		description: 'Reply to update language command'
	},
	async (handleMessage, data) => {
		fetchMock.resetMocks();
		mockFetch(data, `${process.env.API_URL}/api/bot/user/username`, 'POST');
		await handleMessage();
		expect(fetch).toBeCalledWith(`${process.env.API_URL}/api/bot/user/username`, {
			method: 'POST',
			body: JSON.stringify({
				id: 6484647,
				language: data
			})
		});
	}
);

botTest<number>(
	{
		assertions: [
			new Assertion('languageUpdateForbidden', '!language 6484647 en', 404),
			new Assertion('languageUpdateForbidden', '!language 6484647 en', 403)
		],
		bot: 'osu!',
		description: 'Reply to update language command when id and username did not match'
	},
	async (handleMessage, data) => {
		mockFetch(data, `${process.env.API_URL}/api/bot/user/username`, 'POST');
		await handleMessage();
		expect(fetch).toBeCalledWith(`${process.env.API_URL}/api/bot/user/username`, {
			method: 'POST',
			body: JSON.stringify({
				id: 6484647,
				language: 'en'
			})
		});
	}
);

botTest(
	{
		assertions: Object.keys(languages)
			.map(
				(language) =>
					new Assertion(
						['didYouMean', `!language 6484647 ${language}`],
						`!language 6484647 ${language}_`
					)
			)
			.concat(new Assertion(['didYouMean', `!language 6484647 en`], `!language 6484647_ en`)),
		bot: 'osu!',
		description: 'Reply to update language command guessing incorrect language and id'
	},
	(handleMessage) => handleMessage()
);

botTest<Languages>(
	{
		assertions: Object.keys(languages).map(
			(language) => new Assertion('commandNotFount', '!', language, language)
		),
		bot: 'osu!',
		description: 'Detect user language'
	},
	async (handleMessage, data) => {
		mockFetch(data, `${process.env.API_URL}/api/bot/user/username`);
		await handleMessage();
		expect(fetch).toBeCalledWith(`${process.env.API_URL}/api/bot/user/username`);
	}
);

botTest(
	{
		assertions: new Assertion('commandNotFount', '!'),
		bot: 'osu!',
		description: 'Default to english on error'
	},
	async (handleMessage) => {
		fetchMock.resetMocks();
		fetchMock.mockRejectOnce();
		await handleMessage();
		expect(fetch).toBeCalledWith(`${process.env.API_URL}/api/bot/user/username`);
	}
);
