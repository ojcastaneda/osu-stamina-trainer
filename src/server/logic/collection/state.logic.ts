import {Cursor} from '../../../osuApi/osuApiService';
import fileManager from '../fileManager';

const retrieveState = async (): Promise<Cursor | undefined> => {
	const state = await fileManager.getFileAsString('state.json');
	if (state !== undefined) return JSON.parse(state);
};

const updateState = async (lastDate: number, lastBeatmapset: number) => {
	if (lastDate >= 0 && lastBeatmapset >= 0) {
		await fileManager.uploadFile(JSON.stringify({
			lastDate,
			lastBeatmapset
		}), 'state.json');
	}
};

export {retrieveState, updateState};