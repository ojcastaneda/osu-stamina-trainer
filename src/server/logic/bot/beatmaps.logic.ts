import Beatmap from '../../models/beatmap';
import Filter from '../../models/filter';

/**
 * Finds a requests that matches the filters and the specification to use the double time statistics. If a request does not include this specification
 * it will be chosen randomly to whether or not to use the specification and if it does not find a request it will try to find it in the remaining option
 *
 * @param isDoubleTime - The specification to whether or not to retrieve the beatmap with the double time statistics, the no modification statistics or any
 * @param filters - The dynamic filters with a variable property, value and conditional operator
 * @returns A promise of an object with the least recently requested beatmap that match the filters or null if not found and the specification to
 * whether or not to retrieve the beatmap with the double time statistics
 */
const requestBeatmap = async (
	isDoubleTime: boolean | undefined,
	filters: Filter[]
): Promise<{ beatmap: Beatmap | undefined; isDoubleTime: boolean }> => {
	if (isDoubleTime === undefined) {
		isDoubleTime = Math.random() < 0.5;
		const beatmap = await Beatmap.retrieveBeatmapRequest(isDoubleTime, filters);
		if (beatmap) return { beatmap, isDoubleTime };
		return {
			beatmap: await Beatmap.retrieveBeatmapRequest(!isDoubleTime, filters),
			isDoubleTime: !isDoubleTime
		};
	} else
		return {
			beatmap: await Beatmap.retrieveBeatmapRequest(isDoubleTime, filters),
			isDoubleTime
		};
};

export { requestBeatmap };
