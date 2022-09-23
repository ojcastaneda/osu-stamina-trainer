import 'dotenv/config';
import { BanchoClient, PrivateMessage } from 'bancho.js';
import { Client, GatewayIntentBits, Message, Partials } from 'discord.js';
import { i18n, I18nProperties, Languages, languages } from './i18n';
import { request } from './commands/request';
import { analyzeId, analyzeNowPlaying } from './commands/analyze';
import { updateLanguage } from './commands/updateLanguage';
import { formatDiscordResponse } from './discord';
import { MessageDispatcher } from './messageDispatcher';
import levenary from 'levenary';

/**
 * Format a message to log to the console.
 *
 * @param content - The content to log.
 * @param level - The Logging level of the interaction.
 * @param origin - The source of the interaction.
 */
function log(content: string, level: 'ERROR' | 'INFO', origin: 'Discord' | 'osu!') {
	const timestamp = new Date().toISOString();
	switch (level) {
		case 'ERROR':
			return console.error(
				`\x1b[2m${timestamp}\x1b[0m \x1b[31m${level}\x1b[0m \u001b[1m${origin}:\x1b[0m ${content}`
			);
		case 'INFO':
			return console.info(
				`\x1b[2m${timestamp}\x1b[0m \x1b[32m${level}\x1b[0m \u001b[1m${origin}:\x1b[0m ${content}`
			);
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
			return ['help', 'en'];
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
			return 'languages';
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
export async function retrieveLanguage(username: string): Promise<Languages> {
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
		const responseMessage = i18n(language, response);
		if (process.env.NODE_ENV === 'production') await user.sendMessage(responseMessage);
		log(
			`${user.ircUsername} | ${message} | ${language} | ${JSON.stringify(response)}`,
			'INFO',
			'osu!'
		);
		if (Array.isArray(response) && response[0] === 'beatmapInformation' && !response[3])
			return response[1].id;
	} catch (error) {
		if (process.env.NODE_ENV === 'production')
			user.sendMessage(i18n('en', 'unexpectedError')).catch(() => ({}));
		log(
			`${user.ircUsername} | ${message} | ${error instanceof Error ? error.message : error}`,
			'ERROR',
			'osu!'
		);
	}
}

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
		const responseMessage = formatDiscordResponse(response);
		if (process.env.NODE_ENV === 'production') await message.reply(responseMessage);
		log(`${message.author.username} | ${message.content} | ${JSON.stringify(response)}`, 'INFO', 'Discord');
		if (Array.isArray(response) && response[0] === 'beatmapInformation' && !response[3])
			return response[1].id;
	} catch (error) {
		if (process.env.NODE_ENV === 'production')
			message.reply(formatDiscordResponse('unexpectedError')).catch(() => ({}));
		log(
			`${message.author.username} | ${message.content} | ${error instanceof Error ? error.message : error}`,
			'ERROR',
			'Discord'
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
	const osuDispatcher = new MessageDispatcher<PrivateMessage>(handleOsuPM);
	bancho.on('PM', (message: PrivateMessage) => {
		if (message.self) return;
		osuDispatcher.enqueue(message, message.user.ircUsername);
	});
	await bancho.connect();
	log('Bot connected', 'INFO', 'osu!');
	const discord = new Client({
		intents: [
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.Guilds
		],
		partials: [Partials.Channel]
	});
	const discordDispatcher = new MessageDispatcher<Message>(handleDiscordMessage);
	discord.on('messageCreate', (message: Message) => {
		if (message.author.bot) return;
		discordDispatcher.enqueue(message, message.author.id);
	});
	await discord.login(process.env.DISCORD_TOKEN);
	log('Bot connected', 'INFO', 'Discord');
}

startBot();
