import { ConstantResponses, I18nProps } from '../i18n';

export function parseNowPlaying(nowPlaying: string): ConstantResponses | number {
	const idStart = nowPlaying.indexOf('#/');
	if (idStart < 0) return 'commandNotFount';
	const splittedString = nowPlaying.slice(idStart + 2);
	const id = parseInt(splittedString.slice(0, splittedString.indexOf(' ')));
	return isNaN(id) ? 'commandNotFount' : id;
}

export async function analyze(nowPlaying: string): Promise<I18nProps> {
	const id = parseNowPlaying(nowPlaying);
	if (typeof id === 'string') return id;
	const response = await fetch(`${process.env.API_URL}/api/bot/beatmap/${id}`);
	if (response.status === 404) return 'simpleRequestNotFound';
	return ['simpleRequest', await response.json()];
}
