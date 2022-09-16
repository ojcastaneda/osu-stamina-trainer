import { ConstantResponses, I18nProperties } from '../i18n';

/**
 * Returns the beatmap id  if the message from the user is formatted according to the now playing command.
 * Otherwise, returns the i18n property for `command not found`.
 *
 * @param nowPlaying - The message from the user.
 * @returns The i18n property for `command not found` or the beatmap id.
 */
export function parseNowPlaying(nowPlaying: string): ConstantResponses | number {
	const idStart = nowPlaying.indexOf('#/');
	if (idStart < 0) return 'commandNotFount';
	const splittedString = nowPlaying.slice(idStart + 2);
	const id = parseInt(splittedString.slice(0, splittedString.indexOf(' ')));
	return isNaN(id) ? 'commandNotFount' : id;
}

/**
 * Returns the i18n properties for `analysis` if the command is correct.
 * If the beatmap is not available returns the i18n properties for `Analysis not found`.
 * Otherwise, returns the the i18n property for `command not found`.
 *
 * @param nowPlaying - The message from the user.
 * @returns The corresponding i18n properties.
 */
export async function analyzeNowPlaying(nowPlaying: string): Promise<I18nProperties> {
	const id = parseNowPlaying(nowPlaying);
	if (typeof id === 'string') return id;
	const response = await fetch(`${process.env.API_URL}/api/bot/beatmap/${id}`);
	return response.status === 404
		? 'analysisNotFound'
		: ['beatmapInformation', await response.json(), ''];
}

/**
 * Returns the i18n properties for `analysis` if the command is correct.
 * If the beatmap is not available returns the i18n properties for `Analysis not found`.
 * Otherwise, returns the the i18n property for `command not found`.
 *
 * @param command - The command used `!c` or `!check`.
 * @param id - The id of the beatmap to analyze.
 * @returns The corresponding i18n properties.
 */
export async function analyzeId(command: string, id: string): Promise<I18nProperties> {
	const parsedId = parseInt(id);
	if (isNaN(parsedId)) return ['didYouMean', `${command} 2766688`];
	const response = await fetch(`${process.env.API_URL}/api/bot/beatmap/${parsedId}`);
	return response.status === 404
		? 'analysisNotFound'
		: ['beatmapInformation', await response.json(), ''];
}
