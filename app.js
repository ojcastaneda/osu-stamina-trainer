const commandProcessing = require('./commands/commandsManager');
const authManager = require('./authManager');
const bancho = require('bancho.js');
const cron = require('node-cron');
require('dotenv/config');

setup = async () => {
    try {
        await authManager.serverTokenRequest();
        cron.schedule('0 0 */23 * * *', async () => {
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
                const response = await commandProcessing(message.message);
                if (response) message.user.sendMessage(response).catch((error) => console.log(error));
            }
        });
    } catch (error) {
        console.log(error);
    }
}

setup();
