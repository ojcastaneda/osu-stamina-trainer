import {submit, help, commandNotFound, noBeatmapsFound, incorrectFilters, didYouMean} from './dictionary';
import {BeatmapRequest} from '../server/logic/bot/beatmaps';
import request from './request/request';

/**
 * Generates a response message based on the provided command.
 *
 * @param message - The command provided.
 * @returns A promise of the response message.
 */
const commandProcessing = async (message: string): Promise<string> => {
	const params = message.toLowerCase().split(' ');
	const command = params.shift();
	if (command === undefined || command[0] !== '!') return commandNotFound;
	switch (command[1]) {
		case 'r':
			return command === '!r' || command === '!request' ? makeResponse(command, await request(params)) :
				didYouMean(`!request ${params.join(' ')}`);
		case 's':
			return command === '!submit' ? submit : didYouMean('!submit');
		case 'h':
			return command === '!help' ? help : didYouMean('!help');
		default:
			return commandNotFound;
	}
};

/**
 * Formats a response message based off of a beatmap and based on the modification used for the beatmap statistics.
 *
 * @param request - The request containing the beatmap and the modification used for the beatmap statistics.
 * @returns A string of the formatted response message.
 */
const makeResponse = (command: string, request: BeatmapRequest | string): string => {
	if (typeof request === 'string') return incorrectFilters(`${command} ${request}`);
	const {beatmap, isDoubleTime} = request;
	if (beatmap === undefined) return noBeatmapsFound;
	let seconds: any = beatmap.hit_length! % 60;
	if (seconds < 10) seconds = `0${seconds}`;
	const additionalMods = isDoubleTime ? ' +DT |' : '';
	const type = beatmap.stream_length! < 9 ? 'bursts' : beatmap.stream_length! < 25 ? 'streams' : 'deathstreams';
	const response = `${additionalMods} BPM: ${beatmap.bpm} | Type: ${type} | Average stream length: ${beatmap.stream_length} | ` +
		`Density: ${beatmap.stream_density} | ${beatmap.difficulty_rating} ★ | AR: ${beatmap.ar} | OD: ${beatmap.accuracy} | CS: ${beatmap.cs} | ` +
		`Status: ${beatmap.ranked} | Length: ${Math.floor(beatmap.hit_length! / 60)}:${seconds}`;
	const date = new Date();
	if (date.getUTCDate() === 27 && date.getUTCMonth() === 6) return `[https://osu.ppy.sh/b/${beatmap.id} Blue Zenith [FOUR DIMENSIONS]] ${response}`;
	return `[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.title}] ${response}`;
};

export default commandProcessing;
