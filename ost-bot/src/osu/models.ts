import { Beatmap } from '../models';

/**
 * i18n responses.
 */
export type I18nResponse = {
	analysisNotFound: string;
	availableLanguages: string;
	beatmapInformation: (beatmap: Beatmap, modification: string, alreadyRequested: boolean) => string;
	commandNotFount: string;
	didYouMean: (suggestion: string) => string;
	genericHelp: string;
	help: string;
	languageUpdate: string;
	languageUpdateForbidden: string;
	loved: string;
	ranked: string;
	requestNotFound: string;
	unexpectedError: string;
	unranked: string;
};

export const availableLanguages = 'English (US): "en", Español: "es", Português (BR): "br"';

export const genericHelp =
	'Type "!help en" for more details / Escriba "!help es" para más detalles / Digite "!help br" para mais detalhes';

/**
 * Formats the duration of the beatmap into a `minutes:seconds` format.
 *
 * @param length - The length of the beatmap in seconds.
 * @returns The formatted duration.
 */
export function formatLength(length: number): string {
	const seconds = length % 60;
	return `${Math.floor(length / 60)}:${seconds < 10 ? '0' : ''}${seconds}`;
}
