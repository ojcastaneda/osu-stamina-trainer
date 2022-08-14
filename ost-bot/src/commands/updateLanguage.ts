import { I18nProps, Languages, languages } from '../i18n';

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

export async function updateLanguage(
	id: string,
	language: string,
	username: string
): Promise<I18nProps> {
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
