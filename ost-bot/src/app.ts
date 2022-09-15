import 'dotenv/config';
import { BanchoClient, PrivateMessage } from 'bancho.js';
import { Client, GatewayIntentBits, Message, Partials } from 'discord.js';
import { i18n, I18nProperties, Languages, languages } from './i18n';
import { request } from './commands/request';
import { analyzeId, analyzeNowPlaying } from './commands/analyze';
import { updateLanguage } from './commands/updateLanguage';
import { formatDiscordResponse } from './discord';
import { MessageDispatcher } from './messageDispatcher';

/**
 * Default help message for all users.
 */
const help = 'Type "!help en" for more details / Escriba "!help es" para más detalles';

/**
 * Logs result of the interaction of a message sent by an user to any bot.
 *
 * @param level - The Logging level of the interaction.
 * @param message - The original message from the user.
 * @param origin - The bot source of the interaction.
 * @param result - The result of the interaction.
 * @param user - The user that started the interaction.
 */
function logInteraction(
	level: 'ERROR' | 'INFO',
	message: string,
	origin: 'Discord' | 'osu!',
	result: string,
	user: string
) {
	const log = `${new Date().toISOString()} ${level} ${origin} | ${user}: ${message} | ${result}`;
	level === 'INFO' ? console.info(log) : console.error(log);
}

/**
 * Returns the properties for all the supported responses of the Discord bot.
 *
 * @param message - The message from the user.
 * @returns The properties for the response.
 */
async function processDiscordMessage(
	message: string,
	skippedIds: number[]
): Promise<I18nProperties | 'invite' | undefined> {
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
			return 'help';
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

/**
 * Returns the i18n properties for all the supported responses of the osu! bot.
 *
 * @param message - The message from the user.
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
 * Handles the incoming messages for the osu! bot.
 * Sends a reply with the expected response if no exception ocurred during the message processing.
 * Otherwise, sends a generic error reply.
 *
 * @param privateMessage - The incoming message from an user.
 */
async function handleOsuPM(
	{ message, user }: PrivateMessage,
	skippedIds: number[]
): Promise<number | undefined> {
	try {
		const [language, response] = await Promise.all([
			retrieveLanguage(user.ircUsername),
			processOsuMessage(message, skippedIds, user.ircUsername)
		]);
		const responseMessage = response === 'genericHelp' ? help : i18n(language, response);
		if (process.env.NODE_ENV === 'production') await user.sendMessage(responseMessage);
		logInteraction('INFO', message, 'osu!', responseMessage, user.ircUsername);
		if (Array.isArray(response) && response[0] === 'beatmapInformation') return response[1].id;
	} catch (error) {
		if (process.env.NODE_ENV === 'production')
			user.sendMessage(i18n('en', 'unexpectedError')).catch(() => ({}));
		logInteraction(
			'ERROR',
			message,
			'osu!',
			error instanceof Error ? error.message : JSON.stringify(error),
			user.ircUsername
		);
	}
}

/**
 * Handles the incoming messages for the Discord bot.
 * Sends a reply with the expected response if no exception ocurred during the message processing.
 * Otherwise, sends a generic error reply.
 *
 * @param message - The incoming message from an user.
 */
async function handleDiscordMessage(
	message: Message,
	skippedIds: number[]
): Promise<number | undefined> {
	try {
		const response = await processDiscordMessage(message.content, skippedIds);
		if (response === undefined) return;
		const responseMessage = formatDiscordResponse(response);
		if (process.env.NODE_ENV === 'production') await message.reply(responseMessage);
		logInteraction(
			'INFO',
			message.content,
			'Discord',
			JSON.stringify(responseMessage),
			message.author.username
		);
		if (Array.isArray(response) && response[0] === 'beatmapInformation') return response[1].id;
	} catch (error) {
		if (process.env.NODE_ENV === 'production')
			message.reply(formatDiscordResponse('unexpectedError')).catch(() => ({}));
		logInteraction(
			'ERROR',
			message.content,
			'Discord',
			error instanceof Error ? error.message : JSON.stringify(error),
			message.author.username
		);
	}
}

/**
 * Starts the bot if the required credentials were provided.
 */
async function startBot() {
	if (process.env.OSU_USERNAME === undefined || process.env.OSU_PASSWORD === undefined) return;
	const bancho = new BanchoClient({
		username: process.env.OSU_USERNAME,
		password: process.env.OSU_PASSWORD
	});
	const osuDispatcher = new MessageDispatcher<PrivateMessage>();
	bancho.on('PM', (message: PrivateMessage) => {
		if (message.self) return;
		osuDispatcher.enqueue(handleOsuPM, message, message.user.ircUsername);
	});
	await bancho.connect();
	console.info('osu! bot connected');
	const discord = new Client({
		intents: [
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.Guilds
		],
		partials: [Partials.Channel]
	});
	const discordDispatcher = new MessageDispatcher<Message>();
	discord.on('messageCreate', (message: Message) => {
		if (message.author.bot) return;
		discordDispatcher.enqueue(handleDiscordMessage, message, message.author.id);
	});
	await discord.login(process.env.DISCORD_TOKEN);
	console.info('Discord bot connected');
}

startBot();
