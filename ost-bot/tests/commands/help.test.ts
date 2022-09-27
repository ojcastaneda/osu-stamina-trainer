import { languages } from '../../src/osu/formatter';
import { Assertion, botTest } from '../setup';

botTest(
	{
		assertions: new Assertion('genericHelp', '!help'),
		description: 'Reply to generic help command'
	},
	(handleMessage) => handleMessage()
);

botTest(
	{
		assertions: Object.keys(languages).map(
			(language) => new Assertion(['help', language], `!help ${language}`)
		),
		bot: 'osu!',
		description: 'Reply to help command'
	},
	(handleMessage) => handleMessage()
);

botTest(
	{
		assertions: Object.keys(languages).map(
			(language) => new Assertion(['didYouMean', `!help ${language}`], `!help ${language}_`)
		),
		bot: 'osu!',
		description: 'Reply to help command guessing incorrect language'
	},
	(handleMessage) => handleMessage()
);
