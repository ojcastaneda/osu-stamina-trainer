import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageOptions
} from 'discord.js';
import { english, formatLength, I18nProperties, I18nResponse } from './i18n';
import { Beatmap } from './models';

/**
 * Returns a formatted and response of a Discord bot interaction.
 *
 * @param properties - The properties to use to format the response.
 * @returns The formatted message to send to the user.
 */
export function formatDiscordResponse(properties: I18nProperties | 'invite'): MessageOptions {
	if (properties === 'invite') {
		const response = new ActionRowBuilder<ButtonBuilder>({
			components: [
				new ButtonBuilder({
					label: 'Invite bot to server',
					style: ButtonStyle.Link,
					url: `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_ID}&permissions=2048&scope=applications.commands%20bot`
				})
			]
		});
		return { components: [response] };
	}
	let response: EmbedBuilder | undefined;
	if (typeof properties === 'string') {
		response = discordResponse[properties];
	} else {
		switch (properties[0]) {
			case 'didYouMean':
				return { embeds: [discordResponse.didYouMean(properties[1])] };
			case 'beatmapInformation':
				return { embeds: [discordResponse.beatmapInformation(properties[1], properties[2])] };
		}
	}
	return { embeds: [response ?? new EmbedBuilder({ title: english.unexpectedError })] };
}

/**
 * English Discord responses.
 */
export const discordResponse: Pick<
	I18nResponse<EmbedBuilder>,
	'beatmapInformation' | 'didYouMean'
> &
	Partial<I18nResponse<EmbedBuilder>> = {
	analysisNotFound: new EmbedBuilder({ description: english.analysisNotFound }),
	beatmapInformation: (beatmap: Beatmap, modification: string) =>
		new EmbedBuilder({
			title: `${modification} ${beatmap.title}`,
			url: `https://osu.ppy.sh/b/${beatmap.id}`,
			thumbnail: {
				url: `${process.env.WEBSITE_URL}/${beatmap.ranked_status}.png`
			},
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
		}),
	commandNotFount: new EmbedBuilder({
		title: 'osu! Stamina Trainer Wiki',
		url: `${process.env.WEBSITE_URL}/commands`,
		description: 'No command was detected, type `!help` to see the available commands'
	}),
	didYouMean: (suggestion: string) =>
		new EmbedBuilder({ description: english.didYouMean(`\`${suggestion}\``) }),
	help: new EmbedBuilder({
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
	}),
	requestNotFound: new EmbedBuilder({ description: english.requestNotFound })
};
