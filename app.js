const bancho = require('bancho.js');
const commandProcessing = require('./commandsManager').commandProcessing;
require('dotenv/config');

console.log(process.env.BOT_USERNAME)
console.log(process.env.PASSWORD)

const client = new bancho.BanchoClient({username: process.env.BOT_USERNAME, password: process.env.PASSWORD});

client.connect().then(() => {
    console.log('osu! bot connected');
    client.on('PM', ({user, message}) => {
        commandProcessing(user, message);
    });
}).catch((error) => console.log(error));
