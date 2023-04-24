import levenary from 'levenary';
import { languages, Languages } from '../osu/formatter';

/**
 * Returns the user id and language code if the command is correct.
 * Otherwise, returns the guess for the command.
 *
 * @param id - The user id.
 * @param language - The language code.
 * @returns An array with the parsed user id and language code or the guess for the command.
 */
export function parseLanguage(
	id: string | undefined,
	language: string | undefined
): [number, Languages] | ['didYouMean', string] | 'incompleteLanguageUpdate' {
	if (id === undefined || language === undefined) return 'incompleteLanguageUpdate';
	let incorrect = false;
	let parsedLanguage = language;
	if (languages[language] === undefined) {
		parsedLanguage = levenary(language, Object.keys(languages));
		incorrect = true;
	}
	let parsedId = Number(id);
	if (isNaN(parsedId)) {
		parsedId = parseInt(id);
		parsedId = isNaN(parsedId) ? 6484647 : parsedId;
		incorrect = true;
	}
	return incorrect
		? ['didYouMean', `!language ${parsedId} ${parsedLanguage}`]
		: [parsedId, parsedLanguage];
}

/**
 * Updates the language code for the user if the provided credentials match the osu! API
 * and the command is correct, and returns the i18n property for `language update`.
 * If the command is incorrect guesses the correct command, and returns the i18n properties for `did you mean`.
 * Otherwise, returns the i18n property for `forbidden language update`.
 *
 * @param id - The user id.
 * @param language - The language code to update
 * @param username - The irc username.
 * @returns The corresponding i18n properties.
 */
export async function updateLanguage(
	id: string | undefined,
	language: string | undefined,
	username: string
): Promise<
	| ['didYouMean', string]
	| ['languageUpdate', Languages]
	| 'incompleteLanguageUpdate'
	| 'languageUpdateForbidden'
> {
	const parsedResult = parseLanguage(id, language);
	if (typeof parsedResult === 'string') return parsedResult;
	const [parsedId, parsedLanguage] = parsedResult;
	if (typeof parsedId === 'string') return [parsedId, parsedLanguage];
	const request = await fetch(`${process.env.API_URL}/api/bot/user/${username}`, {
		method: 'POST',
		body: JSON.stringify({
			id: parsedId,
			language: parsedLanguage
		})
	});
	return request.ok ? ['languageUpdate', parsedLanguage] : 'languageUpdateForbidden';
}
