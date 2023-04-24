import { Beatmap, parseStreamsLength } from '../../models';
import { availableLanguages, formatLength, genericHelp, I18nResponse } from '../models';

/**
 * Brazilian portuguese i18n responses.
 */
export const br: Readonly<I18nResponse> = {
	analysisNotFound:
		'A análise do Beatmap só está disponível para os beatmaps ou beatmaps classificados que fazem parte da coleção',
	availableLanguages,
	beatmapInformation: (beatmap: Beatmap, modification: string, alreadyRequested: boolean) =>
		`${
			alreadyRequested
				? 'Já não existem beatmaps que não tenham sido solicitados recentemente. Recomenda-se a troca dos filtros utilizados '
				: ''
		}` +
		`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}]${modification} ` +
		`${br[beatmap.ranked_status]} | BPM: ${beatmap.bpm} | ` +
		`Longitud da streams: ${beatmap.streams_length} (${beatmap.longest_stream}) [${
			br[parseStreamsLength(beatmap.streams_length)]
		}] | ` +
		`Densidade da streams: ${beatmap.streams_density} | Espaçamento da streams: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duração: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	bursts: 'Bursts',
	commandNotFount: `Nenhum comando detectado, digite [${process.env.WEBSITE_URL}/commands !help br (site não disponível em português)] para visualizar os comandos disponíveis`,
	deathstreams: 'Deathstreams',
	didYouMean: (suggestion: string) =>
		`O comando detectado é incorreto, significava dizer "${suggestion}" ` +
		`(Esta sugestão pode não ser precisa se espaços desnecessários forem utilizados como espaços para detectar filtros)?`,
	genericHelp,
	help:
		`[${process.env.WEBSITE_URL}/commands Comandos disponíveis (site não disponível em português):] ` +
		`Solicite um beatmap: "!request [BPM] [filtros]", Analisar beatmap atual: "/np", ` +
		`Analisar um beatmap: "!check [o id do beatmap]", Listar comandos: "!help [código do idioma]", ` +
		`Mudar o idioma: "!language [identificação do usuário] [código do idioma]", Listar idiomas: "!languages"]`,
	incompleteLanguageUpdate: `Não se esqueça de fornecer tanto a sua identificação de usuário como o código do idioma "!language [identificação do usuário] [código do idioma]"`,
	languageUpdate: 'Idioma atualizado com sucesso',
	languageUpdateForbidden: 'A identificação fornecida não corresponde ao seu nome de usuário',
	loved: 'Loved',
	ranked: 'Ranqueado',
	requestNotFound:
		'Nenhum mapa de batidas encontrado que combine com os filtros fornecidos, reduza o número de filtros ou altere seus valores',
	streams: 'Streams',
	unexpectedError: `O bot falhou inesperadamente, favor reportar este erro via [${process.env.DISCORD_URL} Discord]`,
	unranked: 'Não ranqueado'
};
