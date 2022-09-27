import 'dotenv/config';
import { BanchoClient, PrivateMessage } from 'bancho.js';
import { Client, GatewayIntentBits, Message, Partials } from 'discord.js';
import { MessageDispatcher } from './messageDispatcher';
import { log } from './models';
import { handleDiscordMessage } from './discord/messageHandler';
import { handleOsuPM } from './osu/messageHandler';

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
