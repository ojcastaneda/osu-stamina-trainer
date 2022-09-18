import { Beatmap } from './models';

/**
 * i18n properties for string responses.
 */
export type ConstantResponses = keyof Omit<
	I18nResponse<string>,
	'beatmapInformation' | 'didYouMean' | 'help' | 'languageUpdate'
>;

/**
 * i18n properties for responses.
 */
export type I18nProperties =
	| ['beatmapInformation', Beatmap, string, boolean]
	| ['didYouMean', string]
	| ['help', Languages]
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
	beatmapInformation: (beatmap: Beatmap, modification: string, alreadyRequested: boolean) => T;
	commandNotFount: T;
	didYouMean: (suggestion: string) => T;
	genericHelp: T;
	help: T;
	languages: T;
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
	beatmapInformation: (beatmap: Beatmap, modification: string, alreadyRequested: boolean) =>
		`${
			alreadyRequested
				? 'The are no beatmaps left that have not been recently requested. It is recommended to change the filters used '
				: ''
		}` +
		`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}]${modification} ` +
		`${english[beatmap.ranked_status]} | BPM: ${beatmap.bpm} | ` +
		`Streams length: ${beatmap.streams_length} (${beatmap.longest_stream}) | ` +
		`Streams density: ${beatmap.streams_density} | Streams spacing: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duration: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	commandNotFount: `No command was detected, type [${process.env.WEBSITE_URL}/commands !help en] to see the available commands`,
	didYouMean: (suggestion: string) =>
		`The detected command is incorrect, did you mean "${suggestion}"? ` +
		`This suggestion may not be accurate with unnecessary spaces as spaces are used to detect filters`,
	genericHelp:
		'Type "!help en" for more details / Escriba "!help es" para más detalles / Digite "!help br" para mais detalhes',
	help:
		`[${process.env.WEBSITE_URL}/commands Available commands:] Request a beatmap: "!request [BPM] [filters]", ` +
		`Analyze current beatmap: "/np", Analyze a beatmap: "!check [beatmap's id]", List commands: "!help [language code]", ` +
		`Change language: "!language [language code]", List languages: "!languages"`,
	languages:
		'English (American): "en", Español: "es", Português (Brasil): "br"',
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
	beatmapInformation: (beatmap: Beatmap, modification: string, alreadyRequested: boolean) =>
		`${
			alreadyRequested
				? 'No hay mapas más mapas que no hayan sido recientemente solicitados. Es recomendable cambiar los filtros usados '
				: ''
		}` +
		`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}]${modification} ` +
		`${spanish[beatmap.ranked_status]} | BPM: ${beatmap.bpm} | ` +
		`Longitud de streams: ${beatmap.streams_length} (${beatmap.longest_stream}) | ` +
		`Densidad de streams: ${beatmap.streams_density} | Espaciado de streams: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duración: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	unexpectedError: `El bot falló inesperadamente, por favor reporte este error vía [${process.env.DISCORD_URL} Discord]`,
	commandNotFount: `No se detectó ningún comando, escriba [${process.env.WEBSITE_URL}/es/commands !help es] para ver los comandos disponibles`,
	didYouMean: (suggestion: string) =>
		`El comando detectado es incorrecto, quiso decir "${suggestion}"? ` +
		`Esta sugerencia puede no ser precisa si se usan espacios innecesarios ya que los espacios son usados para detectar filtros`,
	genericHelp: english.genericHelp,
	help:
		`[${process.env.WEBSITE_URL}/es/commands Comandos disponibles:] Solicitar un mapa: "!request [BPM] [filtros]", ` +
		`Analizar mapa actual: "/np", Analizar un mapa: "!check [id del mapa]", Listar comandos: "!help [código de idioma]", ` +
		`Cambiar idioma: "!language [código de idioma]", Listar idiomas: "!languages"`,
	languages: english.languages,
	languageUpdate: 'Lenguaje actualizado exitosamente',
	languageUpdateForbidden: 'El id suministrado no concuerda con su nombre de usuario',
	loved: 'Amado',
	ranked: 'Clasificado',
	requestNotFound:
		'No se encontraron mapas que coincidan con los filtros suministrados, reduzca el número de filtros o cambie sus valores',
	unranked: 'No clasificado'
};

/**
 * Brazilian portuguese i18n responses.
 */
export const brazilianPortuguese: Readonly<I18nResponse<string>> = {
	analysisNotFound:
		'A análise do Beatmap só está disponível para os beatmaps ou beatmaps classificados que fazem parte da coleção',
	beatmapInformation: (beatmap: Beatmap, modification: string, alreadyRequested: boolean) =>
		`${
			alreadyRequested
				? 'Já não existem beatmaps que não tenham sido solicitados recentemente. Recomenda-se a troca dos filtros utilizados '
				: ''
		}` +
		`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}]${modification} ` +
		`${brazilianPortuguese[beatmap.ranked_status]} | BPM: ${beatmap.bpm} | ` +
		`Longitud da streams: ${beatmap.streams_length} (${beatmap.longest_stream}) | ` +
		`Densidade da streams: ${beatmap.streams_density} | Espaçamento da streams: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duração: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	unexpectedError: `O bot falhou inesperadamente, favor reportar este erro via [${process.env.DISCORD_URL} Discord]`,
	commandNotFount: `Nenhum comando detectado, digite [${process.env.WEBSITE_URL}/commands !help br (site não disponível em português)] para visualizar os comandos disponíveis`,
	didYouMean: (suggestion: string) =>
		`O comando detectado é incorreto, significava dizer "${suggestion}" ` +
		`(Esta sugestão pode não ser precisa se espaços desnecessários forem utilizados como espaços para detectar filtros)?`,
	genericHelp: english.genericHelp,
	help:
		`[${process.env.WEBSITE_URL}/commands Comandos disponíveis (site não disponível em português):] ` +
		`Solicite um beatmap: "!request [BPM] [filtros]", Analisar beatmap atual: "/np", ` +
		`Analisar um beatmap: "!check [o id do beatmap]", Listar comandos: "!help [código do idioma]", ` +
		`Mudar o idioma: "!language [código do idioma]", Listar idiomas: "!languages"]`,
	languages: english.languages,
	languageUpdate: 'Idioma atualizado com sucesso',
	languageUpdateForbidden: 'A identificação fornecida não corresponde ao seu nome de usuário',
	loved: 'Loved',
	ranked: 'Ranqueado',
	requestNotFound:
		'Nenhum mapa de batidas encontrado que combine com os filtros fornecidos, reduza o número de filtros ou altere seus valores',
	unranked: 'Não ranqueado'
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
	es: spanish,
	br: brazilianPortuguese
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
		case 'help':
			return languages[properties[1]].help;
		case 'languageUpdate':
			return languages[properties[1]].languageUpdate;
		case 'beatmapInformation':
			return response.beatmapInformation(properties[1], properties[2], properties[3]);
	}
}
