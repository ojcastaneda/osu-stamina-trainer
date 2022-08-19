import 'dotenv/config';
import { BanchoClient, PrivateMessage } from 'bancho.js';
import { i18n, I18nProperties, Languages, languages } from './i18n';
import { request } from './commands/request';
import { analyze } from './commands/analyze';
import { updateLanguage } from './commands/updateLanguage';

/**
 * Default help message for all users.
 */
const help = 'Type "!help en" for more details / Escriba "!help es" para más detalles';

/**
 * Returns the i18n properties for all the supported responses of the bot.
 *
 * @param message - The message from the user.
 * @param username - The irc username of the user.
 * @returns The i18n properties for the response.
 */
async function processMessage(
	message: string,
	username: string
): Promise<I18nProperties | 'genericHelp'> {
	const parameters = message
		.toLowerCase()
		.split(' ')
		.filter((parameter) => parameter !== '');
	const command = parameters.shift();
	if (command === undefined) return 'commandNotFount';
	if (command[0] !== '!') return analyze(message);
	switch (command) {
		case '!r':
		case '!request':
			return request(command, parameters);
		case '!h':
		case '!help':
			return parameters.length === 0 ? 'genericHelp' : 'help';
		case '!l':
		case '!language':
			return updateLanguage(parameters[0], parameters[1], username);
		default:
			return 'commandNotFount';
	}
}

/**
 * Returns the language code for the specified user if no exception ocurred.
 * Otherwise, returns the language code for english.
 *
 * @param username - The irc username of the user.
 * @returns The language code for the user.
 */
async function retrieveLanguage(username: string): Promise<Languages> {
	try {
		const response = await fetch(`${process.env.API_URL}/api/bot/user/${username}`);
		const language = await response.text();
		return languages[language] === undefined ? 'en' : language;
	} catch (error) {
		return 'en';
	}
}

/**
 * Handles the incoming messages for the bot.
 * Sends a reply with the expected response if no exception ocurred during the message processing.
 * Otherwise, sends a generic error reply.
 *
 * @param privateMessage - The incoming message from an irc user.
 */
async function handlePM({ message, self, user }: PrivateMessage) {
	if (self) return;
	try {
		console.info(`${user.ircUsername}: ${message}`);
		const [language, response] = await Promise.all([
			retrieveLanguage(user.ircUsername),
			processMessage(message, user.ircUsername)
		]);
		const responseMessage = response === 'genericHelp' ? help : i18n(language, response);
		if (process.env.NODE_ENV === 'production') await user.sendMessage(responseMessage);
		console.info(`${user.ircUsername}: ${responseMessage}`);
	} catch (error) {
		if (process.env.NODE_ENV === 'production')
			await user.sendMessage(i18n('en', 'unexpectedError'));
		console.error(`${user.ircUsername}: ${error}`);
	}
}

/**
 * Starts the bot if the required credentials were provided.
 */
async function startBot() {
	if (
		process.env.BOT_USERNAME === undefined ||
		process.env.BOT_PASSWORD === undefined ||
		process.env.API_URL === undefined
	) {
		return;
	}
	const client = new BanchoClient({
		username: process.env.BOT_USERNAME,
		password: process.env.BOT_PASSWORD
	});
	client.on('PM', handlePM);
	await client.connect();
	console.info('osu! bot connected');
}

startBot();
