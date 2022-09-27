import { Beatmap } from '../../models';
import { availableLanguages, formatLength, genericHelp, I18nResponse } from '../models';

/**
 * English i18n responses.
 */
export const en: Readonly<I18nResponse> = {
	analysisNotFound:
		'Beatmap analysis is only available for ranked beatmaps or beatmaps that are part of the collection',
	availableLanguages,
	beatmapInformation: (beatmap: Beatmap, modification: string, alreadyRequested: boolean) =>
		`${
			alreadyRequested
				? 'The are no beatmaps left that have not been recently requested. It is recommended to change the filters used '
				: ''
		}` +
		`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}]${modification} ` +
		`${en[beatmap.ranked_status]} | BPM: ${beatmap.bpm} | ` +
		`Streams length: ${beatmap.streams_length} (${beatmap.longest_stream}) | ` +
		`Streams density: ${beatmap.streams_density} | Streams spacing: ${beatmap.streams_spacing} | ` +
		`${beatmap.difficulty_rating} ★ | AR: ${beatmap.approach_rate} | OD: ${beatmap.accuracy} | ` +
		`CS: ${beatmap.circle_size} | Duration: ${formatLength(beatmap.length)} | ` +
		`95%: ${beatmap.performance_95}PP | 100%: ${beatmap.performance_100}PP`,
	commandNotFount: `No command was detected, type [${process.env.WEBSITE_URL}/commands !help en] to see the available commands`,
	didYouMean: (suggestion: string) =>
		`The detected command is incorrect, did you mean "${suggestion}"? ` +
		`This suggestion may not be accurate with unnecessary spaces as spaces are used to detect filters`,
	genericHelp,
	help:
		`[${process.env.WEBSITE_URL}/commands Available commands:] Request a beatmap: "!request [BPM] [filters]", ` +
		`Analyze current beatmap: "/np", Analyze a beatmap: "!check [beatmap's id]", List commands: "!help [language code]", ` +
		`Change language: "!language [language code]", List languages: "!languages"`,
	languageUpdate: 'Language updated successfully',
	languageUpdateForbidden: 'The provided id does not match your username',
	loved: 'Loved',
	ranked: 'Ranked',
	requestNotFound:
		'No beatmaps found that match the provided filters, reduce the number of filters or change their values',
	unexpectedError: `The bot failed unexpectedly, please report this error via [${process.env.DISCORD_URL} Discord]`,
	unranked: 'Unranked'
};
