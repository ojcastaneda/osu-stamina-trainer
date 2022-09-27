import { ModificationIndicator } from '../commands/request';
import { Beatmap } from '../models';
import { br } from './i18n/br';
import { en } from './i18n/en';
import { es } from './i18n/es';
import { I18nResponse } from './models';

/**
 * i18n properties for responses.
 */
export type I18nProperties =
	| ['beatmapInformation', Beatmap, ModificationIndicator, boolean]
	| ['didYouMean', string]
	| ['help', Languages]
	| ['languageUpdate', Languages]
	| keyof Omit<I18nResponse, 'beatmapInformation' | 'didYouMean' | 'help' | 'languageUpdate'>;

export type Languages = keyof typeof languages;

/**
 * Record of languages for sending a response.
 */
export const languages: Record<string, I18nResponse> = {
	en,
	es,
	br
};

/**
 * Returns a formatted and internationalized response of an osu! bot interaction.
 *
 * @param language - The language to use for the response.
 * @param properties - The properties to use to format the response.
 * @returns The formatted message to send to the user.
 */
export function formatResponse(language: Languages, properties: I18nProperties): string {
	const response = languages[language];
	if (typeof properties === 'string') return response[properties];
	switch (properties[0]) {
		case 'beatmapInformation':
			return response.beatmapInformation(properties[1], properties[2], properties[3]);
		case 'didYouMean':
			return response.didYouMean(properties[1]);
		case 'help':
			return languages[properties[1]].help;
		case 'languageUpdate':
			return languages[properties[1]].languageUpdate;
	}
}

/**
 * Returns the language code for the specified user if no exception ocurred.
 * Otherwise, returns the language code for english.
 *
 * @param username - The irc username of the user.
 * @returns The language code for the user.
 */
export async function retrieveLanguage(username: string): Promise<Languages> {
	try {
		const response = await fetch(`${process.env.API_URL}/api/bot/user/${username}`);
		const language = await response.text();
		return languages[language] === undefined ? 'en' : language;
	} catch (error) {
		return 'en';
	}
}
