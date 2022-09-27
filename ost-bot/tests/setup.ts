import { PrivateMessage } from 'bancho.js';
import { Message } from 'discord.js';
import fetchMock, { MockResponseInit } from 'jest-fetch-mock';
import { Beatmap, numericFilters } from '../src/models';
import {
	formatResponse as formatDiscordResponse,
	I18nProperties as DiscordProperties
} from '../src/discord/formatter';
import { handleDiscordMessage } from '../src/discord/messageHandler';
import {
	formatResponse as formatOsuResponse,
	I18nProperties as OsuProperties,
	Languages
} from '../src/osu/formatter';
import { handleOsuPM } from '../src/osu/messageHandler';
import { ModificationIndicator } from '../src/commands/request';

fetchMock.enableMocks();

process.env.NODE_ENV = 'production';

export const testBeatmap: Beatmap = {
	accuracy: numericFilters.od.value,
	approach_rate: numericFilters.ar.value,
	bpm: numericFilters.bpm.value,
	circle_size: numericFilters.cs.value,
	difficulty_rating: numericFilters.stars.value,
	id: 2766688,
	last_updated: new Date(`${numericFilters.year.value}-06-01T00:00:00+00:00`),
	length: numericFilters.length.value,
	longest_stream: numericFilters.longest.value,
	performance_100: numericFilters.pp.value,
	performance_95: numericFilters.pp95.value,
	ranked_status: 'ranked',
	streams_density: numericFilters.density.value,
	streams_length: numericFilters.average.value,
	streams_spacing: numericFilters.spacing.value,
	title: 'Genryuu Kaiko [Nostalgia]'
};

export const expectedTestBeatmap: ['beatmapInformation', Beatmap, ModificationIndicator, boolean] =
	['beatmapInformation', testBeatmap, '', false];

type I18nProperties = DiscordProperties | OsuProperties;

export class Assertion<T = undefined> {
	data: T;
	expectedResponse: I18nProperties;
	language: Languages;
	message: string;
	skippedIds: number[];

	constructor(
		expectedResponse: I18nProperties,
		message: string,
		data: T = undefined as T,
		language: Languages = 'en',
		skippedIds: number[] = []
	) {
		this.expectedResponse = expectedResponse;
		this.message = message;
		this.data = data;
		this.language = language;
		this.skippedIds = skippedIds;
	}
}

type Bot = 'Discord' | 'osu!';

type Configuration<T> = {
	assertions: Assertion<T> | Assertion<T>[];
	bot?: Bot;
	description: string;
};

type TestBody<T> = (
	handleMessage: () => Promise<number | undefined>,
	data?: T
) => Promise<number | undefined | void>;

export function botTest<T>(
	{ assertions, bot, description }: Configuration<T>,
	testBody: TestBody<T>
) {
	const scenarios = Array.isArray(assertions) ? assertions : [assertions];
	if (bot === undefined || bot === 'Discord') {
		test(`Discord: ${description}`, async () => {
			for (const assertion of scenarios) {
				fetchMock.resetMocks();
				jest.resetModules();
				await discordTest(assertion, testBody);
			}
		});
	}
	if (bot === undefined || bot === 'osu!')
		test(`osu!: ${description}`, async () => {
			for (const assertion of scenarios) {
				fetchMock.resetMocks();
				jest.resetModules();
				await osuTest(assertion, testBody);
			}
		});
}

async function discordTest<T>(
	{ data, expectedResponse, message, skippedIds }: Assertion<T>,
	testBody: TestBody<T>
) {
	const testMessage = {
		author: { username: 'username' },
		content: message,
		reply: jest.fn(() => Promise<void>)
	} as unknown as Message;
	await testBody(() => handleDiscordMessage(testMessage, skippedIds ?? []), data);
	expect(testMessage.reply).toBeCalledWith(
		formatDiscordResponse(expectedResponse as DiscordProperties)
	);
}

async function osuTest<T>(
	{ data, expectedResponse, language, message, skippedIds }: Assertion<T>,
	testBody: TestBody<T>
) {
	const testMessage = {
		message,
		user: { ircUsername: 'username', sendMessage: jest.fn(() => Promise<void>) }
	} as unknown as PrivateMessage;
	mockFetch(language ?? 'en', `${process.env.API_URL}/api/bot/user/username`);
	await testBody(() => handleOsuPM(testMessage, skippedIds ?? []), data);
	expect(testMessage.user.sendMessage).toBeCalledWith(
		formatOsuResponse(language ?? 'en', expectedResponse as OsuProperties)
	);
}

export function mockFetch<T>(data: T | 404 | 403, url: string, method = 'GET') {
	let body: string | MockResponseInit = typeof data === 'string' ? data : JSON.stringify(data);
	if (data === 404) body = { body: '', init: { status: 404 } };
	else if (data === 403) body = { body: '', init: { status: 403 } };
	fetchMock.mockResponseOnce((request) => {
		return request.url === url && request.method === method
			? Promise.resolve(body)
			: Promise.reject(new Error());
	});
}
