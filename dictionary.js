const commandIncorrectParams = `Your inputted parameters for this command are incorrect or not allowed, [${process.env.WIKI_URL} check out the wiki to learn more]`;
const commandNotFound = `This command does not exist, [${process.env.WIKI_URL} check out the wiki to learn more]`;
const commandNoPrefix = `No command detected, [${process.env.WIKI_URL} check out the wiki to learn more]`;
const submit = `Check our [${process.env.SUBMISSIONS_URL} website] to submit beatmaps to the collection`;
const help = `Check out the [${process.env.WIKI_URL} wiki] to learn about all the available commands`;
const serverNotAvailable = 'Our servers are not available at the moment, please try again later';
const noBeatmapsFound = 'No beatmaps available for the inputted parameters';
const averageStreamLength = 'Average stream length';
const density = 'Density';
const length = 'Length';
const status = 'Status';
const type = 'Type';

module.exports = {
	averageStreamLength,
	commandIncorrectParams,
	commandNoPrefix,
	commandNotFound,
	density,
	help,
	length,
	noBeatmapsFound,
	serverNotAvailable,
	status,
	submit,
	type
};
