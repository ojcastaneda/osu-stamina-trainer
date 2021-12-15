/**
 * The possible message responses for the bot.
 */
const dictionary = {
	commandIncorrectParams: `Your provided parameters for this command are incorrect or not allowed, [${process.env.WIKI_URL} check out the wiki to learn more]`,
	internalBotError: `The bot failed unexpectedly, please report this error via [${process.env.DISCORD_URL} Discord]`,
	commandNotFound: `This command does not exist, [${process.env.WIKI_URL} check out the wiki to learn more]`,
	commandNoPrefix: `No commands detected, [${process.env.WIKI_URL} check out the wiki to learn more]`,
	submit: `Check our [${process.env.SUBMISSIONS_URL} website] to submit beatmaps to the collection`,
	help: `Check out the [${process.env.WIKI_URL} wiki] to learn about all the available commands`,
	serverNotAvailable: 'Our servers are not available at the moment, please try again later',
	noBeatmapsFound: 'No beatmaps available for the provided parameters'
};

export default dictionary;
