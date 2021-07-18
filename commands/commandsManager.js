const dictionary = require('../dictionary');
const request = require('./request');

const prefix = "!";

const commandProcessing = async (message) => {
    message = message.toLowerCase();
    if (message.charAt(0) === prefix) {
        let params = message.substring(1);
        params = params.split(' ');
        const command = params.shift();
        switch (command) {
            case "request":
                return await request(params);
            case "r":
                return await request(params);
            case "submit":
                return dictionary.submit;
            case "help":
                return dictionary.help;
            default:
                return dictionary.commandNotFound;
        }
    } else {
        return dictionary.commandNoPrefix;
    }
};

module.exports = commandProcessing;

