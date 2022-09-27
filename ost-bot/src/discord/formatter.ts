import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageReplyOptions
} from 'discord.js';
import { ModificationIndicator } from '../commands/request';
import { Beatmap } from '../models';
import { en } from '../osu/i18n/en';
import { formatLength } from '../osu/models';

/**
 * i18n properties for responses.
 */
export type I18nProperties =
	| ['beatmapInformation', Beatmap, ModificationIndicator, boolean]
	| ['didYouMean', string]
	| keyof Omit<I18nResponse, 'beatmapInformation' | 'didYouMean'>;

/**
 * i18n responses.
 */
export interface I18nResponse {
	analysisNotFound: MessageReplyOptions;
	beatmapInformation: (
		beatmap: Beatmap,
		modification: string,
		alreadyRequested: boolean
	) => MessageReplyOptions;
	commandNotFount: MessageReplyOptions;
	didYouMean: (suggestion: string) => MessageReplyOptions;
	genericHelp: MessageReplyOptions;
	invite: MessageReplyOptions;
	requestNotFound: MessageReplyOptions;
	unexpectedError: MessageReplyOptions;
}

/**
 * English Discord responses.
 */
export const responses: I18nResponse = {
	analysisNotFound: { embeds: [new EmbedBuilder({ description: en.analysisNotFound })] },
	beatmapInformation: (beatmap: Beatmap, modification: string, alreadyRequested: boolean) => ({
		embeds: [
			new EmbedBuilder({
				title: `${modification} ${beatmap.title}`,
				url: `https://osu.ppy.sh/b/${beatmap.id}`,
				thumbnail: {
					url: `${process.env.WEBSITE_URL}/${beatmap.ranked_status}.png`
				},
				description: alreadyRequested
					? 'The are no beatmaps left that have not been recently requested. It is recommended to change the current filters'
					: undefined,
				fields: [
					{
						name: `\u25B8 BPM: \`${beatmap.bpm}\``,
						value:
							`**\u25B8 Streams length: \`${beatmap.streams_length} (${beatmap.longest_stream})\`**\n` +
							`**\u25B8 Streams spacing: \`${beatmap.streams_spacing}\`**\n` +
							`**\u25B8 AR: \`${beatmap.approach_rate}\`**\n` +
							`**\u25B8 95%: \`${beatmap.performance_95}PP\`**\n` +
							`**\u25B8 Duration: \`${formatLength(beatmap.length)}\`**`,
						inline: true
					},
					{
						name: `\u25B8 Difficulty rating: \`${beatmap.difficulty_rating}\``,
						value:
							`**\u25B8 Streams density: \`${beatmap.streams_density}\`**\n` +
							`**\u25B8 CS: \`${beatmap.circle_size}\`**\n` +
							`**\u25B8 OD: \`${beatmap.accuracy}\`**\n` +
							`**\u25B8 100%: \`${beatmap.performance_100}PP\`**`,
						inline: true
					}
				]
			})
		]
	}),
	commandNotFount: {
		embeds: [
			new EmbedBuilder({
				title: 'osu! Stamina Trainer Wiki',
				url: `${process.env.WEBSITE_URL}/commands`,
				description: 'No command was detected, type `!help` to see the available commands'
			})
		]
	},
	didYouMean: (suggestion: string) => ({
		embeds: [new EmbedBuilder({ description: en.didYouMean(`\`${suggestion}\``) })]
	}),
	genericHelp: {
		embeds: [
			new EmbedBuilder({
				title: 'osu! Stamina Trainer Wiki',
				url: `${process.env.WEBSITE_URL}/commands`,
				fields: [
					{
						name: 'Available commands:',
						value:
							`\u25B8 !request \`[BPM]\` \`[filters]\`\n` +
							`\u25B8 !check \`[beatmap's id]\`\n` +
							`\u25B8 !help \`[language code]\``
					}
				]
			})
		]
	},
	invite: {
		components: [
			new ActionRowBuilder<ButtonBuilder>({
				components: [
					new ButtonBuilder({
						label: 'Invite bot to server',
						style: ButtonStyle.Link,
						url: `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_ID}&permissions=2048&scope=applications.commands%20bot`
					})
				]
			})
		]
	},
	requestNotFound: { embeds: [new EmbedBuilder({ description: en.requestNotFound })] },
	unexpectedError: {
		embeds: [
			new EmbedBuilder({
				description: `The bot failed unexpectedly, please report this error via [Discord](${process.env.DISCORD_URL})`
			})
		]
	}
};

/**
 * Returns a formatted and response of a Discord bot interaction.
 *
 * @param properties - The properties to use to format the response.
 * @returns The formatted message to send to the user.
 */
export function formatResponse(properties: I18nProperties): MessageReplyOptions {
	if (typeof properties === 'string') return responses[properties];
	switch (properties[0]) {
		case 'beatmapInformation':
			return responses.beatmapInformation(properties[1], properties[2], properties[3]);
		case 'didYouMean':
			return responses.didYouMean(properties[1]);
	}
}
