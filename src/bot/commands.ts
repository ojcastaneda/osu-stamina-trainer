import Beatmap from '../server/models/beatmap';
import { submit, help, commandNotFound, noBeatmapsFound, incorrectFilters } from './dictionary';
import request from './request';

/**
 * Generates a response message based on the provided command.
 *
 * @param message - The command provided.
 * @returns A promise of the response message.
 */
const commandProcessing = async (message: string): Promise<string> => {
	const params = message.toLowerCase().split(' ');
	const command = params.shift();
	switch (command) {
		case '!request':
			return makeResponse(command, await request(params));
		case '!r':
			return makeResponse(command, await request(params));
		case '!submit':
			return submit;
		case '!help':
			return help;
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
const makeResponse = (command: string, request: { beatmap: Beatmap | undefined; isDoubleTime: boolean } | string): string => {
	if (typeof request === 'string') return incorrectFilters(`${command} ${request}`);
	const { beatmap, isDoubleTime } = request;
	if (beatmap === undefined) return noBeatmapsFound;
	let seconds: any = beatmap.length! % 60;
	if (seconds < 10) seconds = `0${seconds}`;
	const additionalMods = isDoubleTime ? ' +DT |' : '';
	const type = beatmap.average! < 9 ? 'bursts' : beatmap.average! < 25 ? 'streams' : 'deathstreams';
	const response =
		`${additionalMods} BPM: ${beatmap.bpm} | Type: ${type} | Average stream length: ${beatmap.average} | Density: ${beatmap.density} | ` +
		`${beatmap.stars} ★ | AR: ${beatmap.ar} | OD: ${beatmap.od} | CS: ${beatmap.cs} | Status: ${beatmap.ranked_status} | ` +
		`Length: ${Math.floor(beatmap.length! / 60)}:${seconds}`;
	const date = new Date();
	if (date.getUTCDate() === 27 && date.getUTCMonth() === 6) return `[https://osu.ppy.sh/b/${beatmap.id} Blue Zenith [FOUR DIMENSIONS]] ${response}`;
	return `[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.name}] ${response}`;
};

export default commandProcessing;
