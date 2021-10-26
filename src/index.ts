import dotenv from 'dotenv';
import RankedBeatmapsProcessor from './processing/tasks/rankedBeatmapsProcessor';
import SubmissionsProcessor from './processing/tasks/submissionsProcessor';
import BeatmapsStatisticsUpdater from './processing/tasks/BeatmapsStatisticsUpdater';
import cron from 'node-cron';
import ApiService from './processing/services/api';
import dictionary from './bot/dictionary';
import commandProcessing from './bot/commands';

const {BanchoClient} = require('bancho.js');

if (process.env.NODE_ENV !== 'production') dotenv.config({path: './.env.development'});
else dotenv.config();

const rankedBeatmapsProcessor = new RankedBeatmapsProcessor();

const submissionsProcessor = new SubmissionsProcessor();

const beatmapsStatisticsUpdater = new BeatmapsStatisticsUpdater();

const setup = async () => {
	try {
		const apiService = new ApiService();
		await apiService.retrieveToken();
		cron.schedule('0 0 0 */25 * *', async () => {
			try {
				await apiService.retrieveToken();
				await submissionsProcessor.checkSubmissionsLastUpdate();
				await submissionsProcessor.approveSubmissions();
				await beatmapsStatisticsUpdater.updateFavorites();
			} catch (error) {
				console.log(error);
			}
		});
		const client = new BanchoClient({
			username: process.env.BOT_USERNAME!,
			password: process.env.BOT_PASSWORD!
		});
		if (process.env.NODE_ENV === 'production') await client.connect();
		console.log('osu! bot connected');
		client.on('PM', async (message: any) => {
			if (!message.self) {
				try {
					await message.user.sendMessage(await commandProcessing(message.message, apiService));
				} catch (error) {
					await message.user.sendMessage(dictionary.internalBotError);
				}
			}
		});
		await submissionsProcessor.checkSubmissionsLastUpdate();
		await submissionsProcessor.approveSubmissions();
		await beatmapsStatisticsUpdater.updateFavorites();
	} catch (error) {
		console.log(error);
	}
};

setup();