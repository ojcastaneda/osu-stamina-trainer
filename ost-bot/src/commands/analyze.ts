import { ConstantResponses, I18nProps } from '../i18n';

/**
 * Returns the beatmap id  if the message from the user is formatted according to the now playing command.
 * Otherwise returns the the i18n prop for `command not found`.
 *
 * @param nowPlaying - The message from the user.
 * @returns The corresponding i18n prop.
 */
export function parseNowPlaying(nowPlaying: string): ConstantResponses | number {
	const idStart = nowPlaying.indexOf('#/');
	if (idStart < 0) return 'commandNotFount';
	const splittedString = nowPlaying.slice(idStart + 2);
	const id = parseInt(splittedString.slice(0, splittedString.indexOf(' ')));
	return isNaN(id) ? 'commandNotFount' : id;
}

/**
 * Checks the message from the user and returns the beatmap statistics from the now playing command if available.
 * If the beatmap is not available returns the i18n prop for `Analysis`.
 * Otherwise returns the the i18n prop for `command not found`.
 *
 * @param nowPlaying - The message from the user.
 * @returns The corresponding i18n prop.
 */
export async function analyze(nowPlaying: string): Promise<I18nProps> {
	const id = parseNowPlaying(nowPlaying);
	if (typeof id === 'string') return id;
	const response = await fetch(`${process.env.API_URL}/api/bot/beatmap/${id}`);
	if (response.status === 404) return 'analysisNotFound';
	return ['analysis', await response.json()];
}
