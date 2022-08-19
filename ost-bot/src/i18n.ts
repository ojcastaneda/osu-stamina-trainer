import { Beatmap } from './models';

/**
 * i18n properties for string responses.
 */
export type ConstantResponses = keyof Omit<
	Response,
	'didYouMean' | 'languageUpdate' | 'request' | 'analysis'
>;

/**
 * i18n properties for responses.
 */
export type I18nProperties =
	| ['didYouMean', string]
	| ['languageUpdate', Languages]
	| ['request', Beatmap, string]
	| ['analysis', Beatmap]
	| ConstantResponses;

/**
 * Available languages for responses.
 */
export type Languages = keyof typeof languages;

/**
 * i18n responses.
 */
export interface Response {
	analysis: (beatmap: Beatmap) => string;
	analysisNotFound: string;
	commandNotFount: string;
	didYouMean: (suggestion: string) => string;
	help: string;
	languageUpdate: string;
	languageUpdateForbidden: string;
	loved: string;
	ranked: string;
	request: (beatmap: Beatmap, modification: string) => string;
	requestNotFound: string;
	unexpectedError: string;
	unranked: string;
}

/**
 * English i18n responses.
 */
export const english: Readonly<Response> = {
	analysis: (beatmap: Beatmap) =>
		`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}] ${english[beatmap.ranked_status]} | ` +
		`BPM: ${beatmap.bpm} | Streams length: ${beatmap.streams_length} (${beatmap.longest_stream}) | ` +
		`Streams density: ${beatmap.streams_density} | Streams spacing: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duration: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	analysisNotFound:
		'Beatmap analysis is only available for ranked beatmaps or beatmaps that are part of the collection',
	commandNotFount: `No command was detected, type [${process.env.WEBSITE_URL}/commands !help en] to see the available commands`,
	didYouMean: (suggestion: string) =>
		`The detected command is incorrect, did you mean "${suggestion}"?`,
	help: `Available commands: [${process.env.WEBSITE_URL}/commands !request [BPM] [filters], !submit, !help [language code]`,
	languageUpdate: 'Language updated successfully',
	languageUpdateForbidden: 'The provided id does not match your username',
	loved: 'Loved',
	ranked: 'Ranked',
	request: (beatmap: Beatmap, modification: string) =>
		`[https://osu.ppy.sh/b/${beatmap.id} ${checkTitle(beatmap.title)}]${modification} ` +
		`${english[beatmap.ranked_status]} | BPM: ${beatmap.bpm} | ` +
		`Streams length: ${beatmap.streams_length} (${beatmap.longest_stream}) | ` +
		`Streams density: ${beatmap.streams_density} | Streams spacing: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duration: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	requestNotFound:
		'No beatmaps found that match provided filters, reduce the number of filters or change their values',
	unexpectedError: `The bot failed unexpectedly, please report this error via [${process.env.DISCORD_URL} Discord]`,
	unranked: 'Unranked'
};

/**
 * Spanish i18n responses.
 */
export const spanish: Readonly<Response> = {
	analysis: (beatmap: Beatmap) =>
		`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}] ${english[beatmap.ranked_status]} | ` +
		`BPM: ${beatmap.bpm} | Longitud de streams: ${beatmap.streams_length} (${beatmap.longest_stream}) | ` +
		`Densidad de streams: ${beatmap.streams_density} | Espaciado de streams: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duración: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	analysisNotFound:
		'El análisis de mapas solo está disponible para mapas clasificados o mapas que sean parte de la colección',
	unexpectedError: `El bot falló inesperadamente, por favor reporte este error vía [${process.env.DISCORD_URL} Discord]`,
	commandNotFount: `No se detectó ningún comando, escriba [${process.env.WEBSITE_URL}/es/commands !help es] para ver los comandos disponibles`,
	didYouMean: (suggestion: string) =>
		`El comando detectado es incorrecto, quiso decir "${suggestion}"?`,
	help: `Comandos disponibles: [${process.env.WEBSITE_URL}/es/commands !request [BPM] [filtros], /np, !help [código de lenguaje]]`,
	languageUpdate: 'Lenguaje actualizado exitosamente',
	languageUpdateForbidden: 'El id suministrado no concuerda con su nombre de usuario',
	loved: 'Amado',
	ranked: 'Clasificado',
	request: (beatmap: Beatmap, modification: string) =>
		`[https://osu.ppy.sh/b/${beatmap.id} ${checkTitle(beatmap.title)}]${modification} ` +
		`${english[beatmap.ranked_status]} | BPM: ${beatmap.bpm} | ` +
		`Longitud de streams: ${beatmap.streams_length} (${beatmap.longest_stream}) | ` +
		`Densidad de streams: ${beatmap.streams_density} | Espaciado de streams: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duración: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	requestNotFound:
		'No se encontraron mapas que coinciden con los filtros suministrados, reduzca el número de filtros o cambie sus valores',
	unranked: 'No clasificado'
};

function checkTitle(title: string): string {
	const date = new Date();
	return date.getUTCDate() === 27 && date.getUTCMonth() === 6
		? 'Blue Zenith [FOUR DIMENSIONS]'
		: title;
}

/**
 * Formats the duration of the beatmap into a `minutes:seconds` format.
 *
 * @param length - The length of the beatmap in seconds.
 * @returns The formatted duration.
 */
function formatLength(length: number): string {
	const seconds = length % 60;
	return `${Math.floor(length / 60)}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Record of languages for sending a response.
 */
export const languages: Record<string, Response> = {
	en: english,
	es: spanish
};

/**
 * Returns a formatted and internationalized response of a bot interaction.
 *
 * @param language - The language to use for the response.
 * @param properties - The properties to use to format the response.
 * @returns The formatted message to send to the user.
 */
export function i18n(language: Languages, properties: I18nProperties): string {
	const response = languages[language];
	if (typeof properties === 'string') return response[properties];
	switch (properties[0]) {
		case 'didYouMean':
			return response[properties[0]](properties[1]);
		case 'languageUpdate':
			return languages[properties[1]][properties[0]];
		case 'request':
			return response[properties[0]](properties[1], properties[2]);
		case 'analysis':
			return response[properties[0]](properties[1]);
	}
}
