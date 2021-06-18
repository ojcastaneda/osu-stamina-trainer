const request = require('./commands/request');
const report = require('./commands/report');
const recommend = require('./commands/recommend');

const prefix = "!";
const noPrefix = "No command detected, type !help to check the available commands";
const notFound = "This command does not exists, type !help to check the available commands";
const help = "";

const commandProcessing = (user, message) => {
    if (message[0] === prefix) {
        const splitMessage = message.toLowerCase().split(" ");
        const command = splitMessage[0].substring(1);
        let params = splitMessage.shift();
        switch (command) {
            case "request":
                return request(params);
            case "report":
                return report(params);
            case "recommend":
                return recommend(params);
            case "help":
                return help;
            default:
                return notFound;
        }
    } else {
        return noPrefix;
    }
};

module.exports = {help, commandProcessing};

