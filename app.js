const commandProcessing = require('./commands/commandsManager');
const authManager = require('./authManager');
const dictionary = require('./dictionary');
const bancho = require('bancho.js');
const cron = require('node-cron');
require('dotenv/config');

setup = async () => {
	try {
		await authManager.serverTokenRequest();
		cron.schedule('0 0 */11 * * *', async () => {
			await authManager.serverTokenRequest();
		});
		const client = new bancho.BanchoClient({
			username: process.env.BOT_USERNAME,
			password: process.env.BOT_PASSWORD
		});
		await client.connect();
		console.log('osu! bot connected');
		client.on('PM', async (message) => {
			if (!message.self) {
				try {
					await message.user.sendMessage(await commandProcessing(message.message));
				} catch (error) {
					await message.user.sendMessage(dictionary.internalBotError);
				}
			}
		});
	} catch (error) {
		console.log(error);
	}
};

setup();
