import { Message } from 'discord.js';
import { analyzeId } from '../commands/analyze';
import { request } from '../commands/request';
import { log } from '../models';
import { formatResponse, I18nProperties } from './formatter';

/**
 * Handles the incoming messages for the Discord bot.
 * Sends a reply with the expected response if no exception ocurred during the message processing.
 * Otherwise, sends a generic error reply.
 *
 * @param message - The incoming message from an user.
 * @param skippedIds - The list of temporarily blacklisted requests.
 */
export async function handleDiscordMessage(
	message: Message,
	skippedIds: number[]
): Promise<number | undefined> {
	try {
		const response = await processDiscordMessage(message.content, skippedIds);
		if (response === undefined) return;
		const responseMessage = formatResponse(response);
		if (process.env.NODE_ENV === 'production') await message.reply(responseMessage);
		log(
			`${message.author.username} | ${message.content} | ${JSON.stringify(response)}`,
			'INFO',
			'Discord'
		);
		if (Array.isArray(response) && response[0] === 'beatmapInformation' && !response[3])
			return response[1].id;
	} catch (error) {
		log(
			`${message.author.username} | ${message.content} | ${
				error instanceof Error ? error.message : JSON.stringify(error)
			}`,
			'ERROR',
			'Discord'
		);
		if (process.env.NODE_ENV === 'production')
			message.reply(formatResponse('unexpectedError')).catch(() => ({}));
	}
}

/**
 * Returns the properties for all the supported responses of the Discord bot.
 *
 * @param message - The message from the user.
 * @param skippedIds - The list of temporarily blacklisted requests.
 * @returns The properties for the response.
 */
async function processDiscordMessage(
	message: string,
	skippedIds: number[]
): Promise<I18nProperties | undefined> {
	const parameters = message
		.toLowerCase()
		.split(' ')
		.filter((parameter) => parameter !== '');
	const command = parameters.shift();
	if (command === undefined || command[0] !== '!') return;
	switch (command) {
		case '!r':
		case '!request':
			return request(command, parameters, skippedIds);
		case '!h':
		case '!help':
			return 'genericHelp';
		case '!i':
		case '!invite':
			return 'invite';
		case '!c':
		case '!check':
			return analyzeId(command, parameters[0]);
		default:
			return 'commandNotFount';
	}
}
