const dictionary = require('../dictionary/en.json');
const recommend = require('./recommend');
const request = require('./request');
const report = require('./report');

const prefix = "!";

const commandProcessing = async (message) => {
    if (message[0] === prefix) {
        const command = message.substring(1, message.indexOf(' '));
        switch (command) {
            case "request":
                return await request(message);
            //case "report":
            //    return await report(message);
            //case "recommend":
            //    return await recommend(message);
            case "help":
                return dictionary.help;
            default:
                return dictionary.notFound;
        }
    } else {
        return dictionary.noPrefix;
    }
};

module.exports = commandProcessing;

