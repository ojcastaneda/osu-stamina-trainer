import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') dotenv.config({path: './.env.development'});
else dotenv.config();
import BeatmapsStatisticsUpdater from './server/logic/collection/tasks/BeatmapsStatisticsUpdater';
import SubmissionsProcessor from './server/logic/collection/tasks/submissionsProcessor';
import commandProcessing from './bot/commands';
import dictionary from './bot/dictionary';
import serverSetup from './server/app';
import cron from 'node-cron';

const {BanchoClient} = require('bancho.js');

const submissionsProcessor = new SubmissionsProcessor();

const beatmapsStatisticsUpdater = new BeatmapsStatisticsUpdater();

const setup = async () => {
	try {
		if (process.env.DATABASE_URL && process.env.DEFAULT_USERNAME && process.env.DEFAULT_PASSWORD && process.env.SECRET_KEY && process.env.AWS_BUCKET_NAME
			&& process.env.AWS_BUCKET_REGION && process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY === undefined)
			return console.log('Credentials required not provided');
		await serverSetup();

		if (process.env.NODE_ENV === 'production' && (process.env.BOT_USERNAME && process.env.BOT_PASSWORD !== undefined)) {
			const client = new BanchoClient({
				username: process.env.BOT_USERNAME!,
				password: process.env.BOT_PASSWORD!
			});
			client.on('PM', async (message: any) => {
				if (!message.self) {
					try {
						await message.user.sendMessage(await commandProcessing(message.message));
					} catch (error) {
						await message.user.sendMessage(dictionary.internalBotError);
					}
				}
			});
			await client.connect();
			console.log('osu! bot connected');
		}

		if (process.env.OSU_ID && process.env.OSU_SECRET !== undefined) {
			await submissionsProcessor.checkSubmissionsLastUpdate();
			await submissionsProcessor.approveSubmissions();
			await beatmapsStatisticsUpdater.updateFavorites();
			cron.schedule('0 0 0 */25 * *', async () => {
				try {
					await submissionsProcessor.checkSubmissionsLastUpdate();
					await submissionsProcessor.approveSubmissions();
					await beatmapsStatisticsUpdater.updateFavorites();
				} catch (error) {
					console.log(error);
				}
			});
		}
	} catch (error) {
		console.log(error);
	}
};

setup();