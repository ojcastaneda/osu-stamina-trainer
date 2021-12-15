import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') dotenv.config({ path: './.env.development' });
else dotenv.config();
import { approveSubmissions, checkSubmissionsLastUpdate } from './server/logic/collection/tasks/submissionsTasks';
import { updateFavorites } from './server/logic/collection/tasks/beatmapsTaks';
import { BanchoClient, PrivateMessage } from 'bancho.js';
import OsuService from './osuApi/osuApiService';
import commandProcessing from './bot/commands';
import dictionary from './bot/dictionary';
import serverSetup from './server/app';
import cron from 'node-cron';
import PQueue from 'p-queue';

/**
 * Initializes the server, the bot and the batch jobs used for updating the collection.
 */
const setup = async (): Promise<void> => {
	if (
		!process.env.DATABASE_URL ||
		!process.env.DEFAULT_USERNAME ||
		!process.env.DEFAULT_PASSWORD ||
		!process.env.SECRET_KEY ||
		!process.env.AWS_BUCKET_NAME ||
		!process.env.AWS_BUCKET_REGION ||
		!process.env.AWS_ACCESS_KEY ||
		!process.env.AWS_SECRET_KEY
	)
		return console.error('Credentials required not provided');
	await serverSetup();

	if (process.env.BOT_USERNAME && process.env.BOT_PASSWORD) {
		const client = new BanchoClient({ username: process.env.BOT_USERNAME!, password: process.env.BOT_PASSWORD! });
		client.on(
			'PM',
			process.env.NODE_ENV !== 'production'
				? (message: PrivateMessage) => {}
				: async (message: PrivateMessage) => {
						if (message.self) return;
						try {
							await message.user.sendMessage(await commandProcessing(message.message));
						} catch (error) {
							await message.user.sendMessage(dictionary.internalBotError);
						}
				  }
		);
		await client.connect();
		console.info('osu! bot connected');
	}

	if (process.env.OSU_ID && process.env.OSU_SECRET) {
		await executeTasks();
		cron.schedule('0 0 0 */25 * *', executeTasks);
	}
};

/**
 * Executes the batch jobs used for updating the collection.
 */
const executeTasks = async (): Promise<void> => {
	try {
		const osuService = new OsuService();
		const promiseQueue = new PQueue({ interval: 1000, intervalCap: 8, concurrency: 8 });
		await checkSubmissionsLastUpdate(osuService, promiseQueue);
		await approveSubmissions(osuService, promiseQueue);
		await updateFavorites(osuService, promiseQueue);
	} catch (error) {
		console.error(error);
	}
};

setup().catch(error => console.error(error));
