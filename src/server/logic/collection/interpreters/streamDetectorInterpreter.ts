import Beatmap from '../../../models/beatmap';
import {execFile} from 'child_process';
import util from 'util';
import os from 'os';

const execFileAsync = util.promisify(execFile);

class StreamDetectorInterpreter {

	public static calculateStreamStatistics = async (beatmap: Beatmap): Promise<void> => {
		const {stdout} = os.platform() === 'win32' ? await execFileAsync('resources/streamDetector/osu-stream-detector.exe', [`beatmaps/${beatmap.id}.osu`, '130']) :
			await execFileAsync('resources/streamDetector/osu-stream-detector', [`beatmaps/${beatmap.id}.osu`, '130']);
		const response = JSON.parse(stdout);
		beatmap.bpm = response.suggested_bpm.bpm;
		beatmap.average = Math.round(response.average_stream_length);
		beatmap.density = Number(response.density.toFixed(2));
	};
}

export default StreamDetectorInterpreter;