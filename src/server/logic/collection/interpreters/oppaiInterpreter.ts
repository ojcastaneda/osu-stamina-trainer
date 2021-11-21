import Beatmap from '../../../models/beatmap';
import {execFile} from 'child_process';
import os from 'os';
import util from 'util';

const execFileAsync = util.promisify(execFile);

class OppaiInterpreter {

	public static calculateDoubleTimeStatistics = async (beatmap: Beatmap): Promise<Beatmap> => {
		const {stdout} = os.platform() === 'win32' ? await execFileAsync('resources/oppai/oppai.exe', [`beatmaps/${beatmap.id}.osu`, '-ojson', '+dt']) :
			await execFileAsync('resources/oppai/oppai', [`beatmaps/${beatmap.id}.osu`, '-ojson', '+dt']);
		return Beatmap.createDoubleTimeBeatmap(beatmap.bpm!, beatmap.length!, JSON.parse(stdout));
	};
}

export default OppaiInterpreter;