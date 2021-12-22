/**
 * The possible message responses for the bot.
 */
const incorrectFilters = (guessedAlternatives: string) =>
	`The provided [${process.env.WIKI_URL} filters] are incorrect or not allowed, try using: "${guessedAlternatives}"`;
const noBeatmapsFound =
	'No beatmaps available for the provided filters, reduce the number of filters or remove bursts/streams/deathstreams filters if you are also using the average filter';
const internalBotError = `The bot failed unexpectedly, please report this error via [${process.env.DISCORD_URL} Discord]`;
const help = `Available commands: !r [bpm] [${process.env.WIKI_URL} filters], !submit, !help`;
const submit = `Check our [${process.env.SUBMISSIONS_URL} website] to submit beatmaps to the collection`;
const commandNotFound = `Command not found, use [${process.env.WIKI_URL} !help] to learn more`;
const didYouMean = (command: string) => `Did you mean ${command}?`;

export { incorrectFilters, noBeatmapsFound, internalBotError, help, submit, commandNotFound, didYouMean };
