import { PrivateMessage } from 'bancho.js';
import levenary from 'levenary';
import { analyzeId, analyzeNowPlaying } from '../commands/analyze';
import { request } from '../commands/request';
import { updateLanguage } from '../commands/language';
import { log } from '../models';
import { formatResponse, I18nProperties, languages, retrieveLanguage } from './formatter';

/**
 * Handles the incoming messages for the osu! bot.
 * Sends a reply with the expected response if no exception ocurred during the message processing.
 * Otherwise, sends a generic error reply.
 *
 * @param privateMessage - The incoming message from an user.
 * @param skippedIds - The list of temporarily blacklisted requests.
 */
export async function handleOsuPM(
	{ message, user }: PrivateMessage,
	skippedIds: number[]
): Promise<number | undefined> {
	try {
		const [language, response] = await Promise.all([
			retrieveLanguage(user.ircUsername),
			processOsuMessage(message, skippedIds, user.ircUsername)
		]);
		const responseMessage = formatResponse(language, response);
		if (process.env.NODE_ENV === 'production') await user.sendMessage(responseMessage);
		log(
			`${user.ircUsername} | ${message} | ${language} | ${JSON.stringify(response)}`,
			'INFO',
			'osu!'
		);
		if (Array.isArray(response) && response[0] === 'beatmapInformation' && !response[3])
			return response[1].id;
	} catch (error) {
		log(
			`${user.ircUsername} | ${message} | ${
				error instanceof Error ? error.message : JSON.stringify(error)
			}`,
			'ERROR',
			'osu!'
		);
		if (process.env.NODE_ENV === 'production')
			user.sendMessage(formatResponse('en', 'unexpectedError')).catch(() => ({}));
	}
}

/**
 * Returns the i18n properties for all the supported responses of the osu! bot.
 *
 * @param message - The message from the user.
 * @param skippedIds - The list of temporarily blacklisted requests.
 * @param username - The irc username of the user.
 * @returns The i18n properties for the response.
 */
async function processOsuMessage(
	message: string,
	skippedIds: number[],
	username: string
): Promise<I18nProperties | 'genericHelp'> {
	const parameters = message
		.toLowerCase()
		.split(' ')
		.filter((parameter) => parameter !== '');
	const command = parameters.shift();
	if (command === undefined) return 'commandNotFount';
	if (command[0] !== '!') return analyzeNowPlaying(message);
	switch (command) {
		case '!r':
		case '!request':
			return request(command, parameters, skippedIds);
		case '!c':
		case '!check':
			return analyzeId(command, parameters[0]);
		case '!h':
		case '!help':
			if (parameters.length === 0) return 'genericHelp';
			return languages[parameters[0]] !== undefined
				? ['help', parameters[0]]
				: ['didYouMean', `!help ${levenary(parameters[0], Object.keys(languages))}`];
		case '!l':
		case '!language':
			return updateLanguage(parameters[0], parameters[1], username);
		case '!languages':
			return 'availableLanguages';
		default:
			return 'commandNotFount';
	}
}
