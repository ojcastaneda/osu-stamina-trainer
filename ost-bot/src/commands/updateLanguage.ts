import { I18nProperties, Languages, languages } from '../i18n';

/**
 * Returns the user id and language code if the command is correct.
 * Otherwise, returns the guess for the command.
 *
 * @param id - The user id.
 * @param language - The language code.
 * @returns An array with the parsed user id and language code or the guess for the command.
 */
export function parseLanguage(
	id: string,
	language: string
): [number, Languages] | ['didYouMean', string] {
	let incorrect = false;
	let parsedLanguage = language;
	if (languages[language] === undefined) {
		parsedLanguage = 'en';
		incorrect = true;
	}
	let parsedId = parseInt(id);
	if (isNaN(parsedId)) {
		parsedId = 6484647;
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
	id: string,
	language: string,
	username: string
): Promise<I18nProperties> {
	const [parsedId, parsedLanguage] = parseLanguage(id, language);
	if (typeof parsedId === 'string') return [parsedId, parsedLanguage];
	const request = await fetch(`/api/bot/user/${username}`, {
		method: 'POST',
		body: JSON.stringify({
			id: parsedId,
			language: parsedLanguage
		})
	});
	return request.ok ? ['languageUpdate', parsedLanguage] : 'languageUpdateForbidden';
}
