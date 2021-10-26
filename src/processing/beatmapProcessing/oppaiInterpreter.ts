import {execFile} from 'child_process';
import util from 'util';
import DoubleTimeBeatmap from '../models/api/doubleTimeBeatmap';
import {ProcessingBeatmap} from '../models/processingBeatmap';

const execFileAsync = util.promisify(execFile);

class OppaiInterpreter {

	public static calculateDoubleTimeStatistics = async (beatmap: ProcessingBeatmap): Promise<DoubleTimeBeatmap> => {
		const {stdout} = await execFileAsync('oppai.exe', [`beatmaps/${beatmap.id}.osu`, '-ojson', '+dt']);
		return new DoubleTimeBeatmap(beatmap.bpm, beatmap.length, JSON.parse(stdout));
	};
}

export default OppaiInterpreter;