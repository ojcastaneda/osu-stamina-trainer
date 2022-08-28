import { Beatmap } from './models';

/**
 * i18n properties for string responses.
 */
export type ConstantResponses = keyof Omit<
	I18nResponse<string>,
	'beatmapInformation' | 'didYouMean' | 'languageUpdate'
>;

/**
 * i18n properties for responses.
 */
export type I18nProperties =
	| ['beatmapInformation', Beatmap, string]
	| ['didYouMean', string]
	| ['languageUpdate', Languages]
	| ConstantResponses;

/**
 * Available languages for responses.
 */
export type Languages = keyof typeof languages;

/**
 * i18n responses.
 */
export interface I18nResponse<T> {
	analysisNotFound: T;
	beatmapInformation: (beatmap: Beatmap, modification: string) => T;
	commandNotFount: T;
	didYouMean: (suggestion: string) => T;
	help: T;
	languageUpdate: T;
	languageUpdateForbidden: T;
	loved: T;
	ranked: T;
	requestNotFound: T;
	unexpectedError: T;
	unranked: T;
}

/**
 * English i18n responses.
 */
export const english: Readonly<I18nResponse<string>> = {
	analysisNotFound:
		'Beatmap analysis is only available for ranked beatmaps or beatmaps that are part of the collection',
	beatmapInformation: (beatmap: Beatmap, modification: string) =>
		`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}]${modification} ` +
		`${english[beatmap.ranked_status]} | BPM: ${beatmap.bpm} | ` +
		`Streams length: ${beatmap.streams_length} (${beatmap.longest_stream}) | ` +
		`Streams density: ${beatmap.streams_density} | Streams spacing: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duration: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	commandNotFount: `No command was detected, type [${process.env.WEBSITE_URL}/commands !help en] to see the available commands`,
	didYouMean: (suggestion: string) =>
		`The detected command is incorrect, did you mean "${suggestion}"?`,
	help: `Available commands: [${process.env.WEBSITE_URL}/commands !request [BPM] [filters], /np, !check [beatmap's id], !help [language code]]`,
	languageUpdate: 'Language updated successfully',
	languageUpdateForbidden: 'The provided id does not match your username',
	loved: 'Loved',
	ranked: 'Ranked',
	requestNotFound:
		'No beatmaps found that match the provided filters, reduce the number of filters or change their values',
	unexpectedError: `The bot failed unexpectedly, please report this error via [${process.env.DISCORD_URL} Discord]`,
	unranked: 'Unranked'
};

/**
 * Spanish i18n responses.
 */
export const spanish: Readonly<I18nResponse<string>> = {
	analysisNotFound:
		'El análisis de mapas solo está disponible para mapas clasificados o mapas que sean parte de la colección',
	beatmapInformation: (beatmap: Beatmap, modification: string) =>
		`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}]${modification} ` +
		`${english[beatmap.ranked_status]} | BPM: ${beatmap.bpm} | ` +
		`Longitud de streams: ${beatmap.streams_length} (${beatmap.longest_stream}) | ` +
		`Densidad de streams: ${beatmap.streams_density} | Espaciado de streams: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duración: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	unexpectedError: `El bot falló inesperadamente, por favor reporte este error vía [${process.env.DISCORD_URL} Discord]`,
	commandNotFount: `No se detectó ningún comando, escriba [${process.env.WEBSITE_URL}/es/commands !help es] para ver los comandos disponibles`,
	didYouMean: (suggestion: string) =>
		`El comando detectado es incorrecto, quiso decir "${suggestion}"?`,
	help: `Comandos disponibles: [${process.env.WEBSITE_URL}/es/commands !request [BPM] [filtros], /np, !check [id del mapa], !help [código de lenguaje]]`,
	languageUpdate: 'Lenguaje actualizado exitosamente',
	languageUpdateForbidden: 'El id suministrado no concuerda con su nombre de usuario',
	loved: 'Amado',
	ranked: 'Clasificado',
	requestNotFound:
		'No se encontraron mapas que coincidan con los filtros suministrados, reduzca el número de filtros o cambie sus valores',
	unranked: 'No clasificado'
};

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

/**
 * Record of languages for sending a response.
 */
export const languages: Record<string, I18nResponse<string>> = {
	en: english,
	es: spanish
};

/**
 * Returns a formatted and internationalized response of an osu! bot interaction.
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
			return response.didYouMean(properties[1]);
		case 'languageUpdate':
			return languages[properties[1]].languageUpdate;
		case 'beatmapInformation':
			return response.beatmapInformation(properties[1], properties[2]);
	}
}
