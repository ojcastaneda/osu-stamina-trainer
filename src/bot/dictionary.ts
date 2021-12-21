/**
 * The possible message responses for the bot.
 */
const incorrectFilters = (guessedAlternatives: string) =>
	`The provided filters are incorrect or not allowed, try using:
	"${guessedAlternatives}"`;
const noBeatmapsFound =
	'No beatmaps available for the provided filters, reduce the number of filters or remove bursts/streams/deathstreams filters if you are also using the average filter';
const internalBotError = `The bot failed unexpectedly, please report this error via [${process.env.DISCORD_URL} Discord]`;
const help = `Available commands:
- !r [bpm] [filters]	| Check out the [${process.env.WIKI_URL} wiki] to learn about all the available filters
- !submit 				| [${process.env.SUBMISSIONS_URL} Website] to submit a beatmap to the collection`;
const submit = `Check our [${process.env.SUBMISSIONS_URL} website] to submit beatmaps to the collection`;
const commandNotFound = `Command not found, use [${process.env.WIKI_URL} !help] to learn more`;

export { incorrectFilters, noBeatmapsFound, internalBotError, help, submit, commandNotFound };
