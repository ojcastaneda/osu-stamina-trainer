import OsuBeatmap from './osu!/beatmap';
import OsuBeatmapset from './osu!/beatmapset';

/**
 * Class that is used for processing the .osu beatmaps
 */
class ProcessingBeatmap {
	/**
	 * The beatmap's id
	 * @type number
	 */
	public id: number;

	/**
	 * The beatmap's beatmapset's id
	 * @type number
	 */
	public setId: number;

	/**
	 * The beatmap's name composed by the song's name and the beatmap version
	 * @type string
	 */
	public name: string;

	/**
	 * The beatmap's circle size
	 * @type number
	 */
	public ar: number;

	/**
	 * The beatmap's circle size
	 * @type number
	 */
	public od: number;

	/**
	 * The beatmap's circle size
	 * @type number
	 */
	public cs: number;

	/**
	 * The beatmap's stream to hit object ratio
	 * @type number
	 */
	public density: number;

	/**
	 * The beatmap's drain length measured in seconds
	 * @type number
	 */
	public length: number;

	/**
	 * The beatmap's highest beats per minute during streams
	 * @type number
	 */
	public bpm: number;

	/**
	 * The beatmap's difficulty
	 * @type number
	 */
	public stars: number;

	/**
	 * The beatmap's ranked status
	 * @type string
	 */
	public rankedStatus: string;

	/**
	 * The beatmap's streams weighted average length
	 * @type number
	 */
	public average: number;

	/**
	 * The beatmap's hash identifier
	 * @type string
	 */
	public hash: string;

	/**
	 * The beatmap's number of favorites from users
	 * @type number
	 */
	public favorites: number;

	/**
	 * The beatmap's date when either the beatmap was ranked or last updated if the beatmap is not ranked
	 * @type Date
	 */
	public lastUpdated: Date;

	public hitObjectIntervals: HitObjectInterval[];

	public bpmValues: Record<number, [number, number]>;

	public bpmRanges: BpmRange[];

	public streams: Stream[];

	/**
	 * Creates an instance of a beatmap for processing .osu beatmaps
	 * @param osuBeatmap The osu! API beatmap corresponding to the beatmap
	 * @param osuBeatmapset The osu! API beatmapset corresponding to the beatmap
	 */
	constructor(osuBeatmap: OsuBeatmap, osuBeatmapset: OsuBeatmapset) {
		this.id = osuBeatmap.id;
		this.setId = osuBeatmapset.id;
		this.name = `${osuBeatmapset.title} [${osuBeatmap.version}]`;
		this.ar = osuBeatmap.ar;
		this.od = osuBeatmap.od;
		this.cs = osuBeatmap.cs;
		this.density = 0;
		this.length = osuBeatmap.length;
		this.bpm = osuBeatmap.bpm;
		this.stars = osuBeatmap.stars;
		if (osuBeatmap.ranked === 1 || osuBeatmap.ranked === 2)
			this.rankedStatus = 'ranked';
		else if (osuBeatmap.ranked === 4)
			this.rankedStatus = 'loved';
		else
			this.rankedStatus = 'unranked';
		this.average = 0;
		this.hash = osuBeatmap.hash;
		this.favorites = osuBeatmapset.favourites;
		if (osuBeatmapset.rankedDate) this.lastUpdated = osuBeatmapset.rankedDate;
		else this.lastUpdated = osuBeatmap.lastUpdated;
		this.hitObjectIntervals = [];
		this.bpmValues = {};
		this.bpmRanges = [];
		this.streams = [];
	}

	public updateStreamBpmFrequency = (bpm: number, frequency: number) => {
		if (this.bpmValues.hasOwnProperty(bpm)) this.bpmValues[bpm] = [bpm, this.bpmValues[bpm][1] + frequency];
		else this.bpmValues[bpm] = [bpm, frequency];
	};
}

class BpmRange {
	public time: number;

	public bpm: number;

	public constructor(time: number, bpm: number) {
		this.time = time;
		this.bpm = bpm;
	}
}

class HitObjectInterval extends BpmRange {

	public distance: number;

	public constructor(time: number, bpm: number, firstHitObject: [x: number, y: number], secondHitObject: [x: number, y: number]) {
		super(time, bpm);
		this.distance = Math.sqrt(Math.pow(firstHitObject[0] - secondHitObject[0], 2) + Math.pow(firstHitObject[1] - secondHitObject[1], 2));
	}
}

class Stream {
	public hitObjects: number;

	public bpmChanges: Record<number, [bpm: number, amount: number]>;

	public maxBpmChanges: [bpm: number, amount: number];

	public constructor() {
		this.hitObjects = 0;
		this.bpmChanges = {};
		this.maxBpmChanges = [0, 0];
	}

	public updateHitObjects = (amount: number) => {
		this.hitObjects += amount;
	};

	public updateBpmChange = (bpm: number, amount: number) => {
		if (!this.bpmChanges.hasOwnProperty(bpm)) this.bpmChanges[bpm] = [bpm, amount];
		else this.bpmChanges[bpm] = [this.bpmChanges[bpm][0], this.bpmChanges[bpm][1] + amount];
		this.maxBpmChanges = [0, 0];
		for (const key in this.bpmChanges)
			if (this.bpmChanges[key][1] > this.maxBpmChanges[1])
				this.maxBpmChanges = this.bpmChanges[key];
	};
}

export {ProcessingBeatmap, BpmRange, HitObjectInterval, Stream};