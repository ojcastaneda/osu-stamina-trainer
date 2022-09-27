import { Beatmap } from '../../models';
import { availableLanguages, formatLength, genericHelp, I18nResponse } from '../models';

/**
 * Spanish i18n responses.
 */
export const es: Readonly<I18nResponse> = {
	analysisNotFound:
		'El análisis de mapas solo está disponible para mapas clasificados o mapas que sean parte de la colección',
	availableLanguages,
	beatmapInformation: (beatmap: Beatmap, modification: string, alreadyRequested: boolean) =>
		`${
			alreadyRequested
				? 'No hay mapas más mapas que no hayan sido recientemente solicitados. Es recomendable cambiar los filtros usados '
				: ''
		}` +
		`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}]${modification} ` +
		`${es[beatmap.ranked_status]} | BPM: ${beatmap.bpm} | ` +
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
	genericHelp,
	help:
		`[${process.env.WEBSITE_URL}/es/commands Comandos disponibles:] Solicitar un mapa: "!request [BPM] [filtros]", ` +
		`Analizar mapa actual: "/np", Analizar un mapa: "!check [id del mapa]", Listar comandos: "!help [código de idioma]", ` +
		`Cambiar idioma: "!language [código de idioma]", Listar idiomas: "!languages"`,
	languageUpdate: 'Lenguaje actualizado exitosamente',
	languageUpdateForbidden: 'El id suministrado no concuerda con su nombre de usuario',
	loved: 'Amado',
	ranked: 'Clasificado',
	requestNotFound:
		'No se encontraron mapas que coincidan con los filtros suministrados, reduzca el número de filtros o cambie sus valores',
	unranked: 'No clasificado'
};
