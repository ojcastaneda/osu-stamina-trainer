import Beatmap from '../../server/models/beatmap';

enum BotRequestProperties {
	bpm = 'bpm', length = 'length', average = 'average', od = 'od', ar = 'ar', cs = 'cs', density = 'density', stars = 'stars', year = 'year'
}

interface Values {
	defaultValue: number,
	minimum: number,
	maximum?: number,
	range: number,
	property?: BotRequestProperties
}

const filters: Record<(keyof Beatmap), Values | undefined> = {
	bpm: {
		defaultValue: 180, minimum: 130, range: 5, property: BotRequestProperties.bpm
	}, hit_length: {
		defaultValue: 90, minimum: 1, range: 5, property: BotRequestProperties.length
	}, stream_length: {
		defaultValue: 16, minimum: 3, range: 2, property: BotRequestProperties.average
	}, accuracy: {
		defaultValue: 9, minimum: 0, maximum: 11.1, range: 0.5, property: BotRequestProperties.od
	}, ar: {
		defaultValue: 9, minimum: 0, maximum: 11, range: 0.5, property: BotRequestProperties.ar
	}, cs: {
		defaultValue: 4, minimum: 0, maximum: 12, range: 0.5, property: BotRequestProperties.cs
	}, stream_density: {
		defaultValue: 0.5, minimum: 0.3, maximum: 1, range: 0.1, property: BotRequestProperties.density
	}, difficulty_rating: {
		defaultValue: 6, minimum: 3, range: 0.5, property: BotRequestProperties.stars
	}, last_updated: {
		defaultValue: 2018, minimum: 2007, range: 0, property: BotRequestProperties.year
	}, beatmapset_id: undefined, favourite_count: undefined, play_count: undefined, active: undefined, title: undefined, checksum: undefined,
	ranked: undefined, last_verified: undefined, last_requested: undefined, id: undefined
};
export {BotRequestProperties, filters};