const dictionary = require('../dictionary/en.json');
const recommend = require('./recommend');
const request = require('./request');
const report = require('./report');

const prefix = "!";

const commandProcessing = async (message) => {
    if (message.charAt(0) === prefix) {
        let params = message.substring(1);
        params = params.split(' ');
        const command = params.shift();
        switch (command) {
            case "request":
                return await request(params);
            case "r":
                return await request(params);
            //case "report":
            //    return await report(params);
            //case "recommend":
            //    return await recommend(params);
            case "help":
                return dictionary.help
            default:
                return dictionary.commandNotFound;
        }
    } else {
        return dictionary.commandNoPrefix;
    }
};

module.exports = commandProcessing;

