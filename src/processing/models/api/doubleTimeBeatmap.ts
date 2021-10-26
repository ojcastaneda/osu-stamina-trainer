/**
 * Class that represents the beatmaps archived in the collection
 */
class DoubleTimeBeatmap {

	/**
	 * The beatmap's highest beats per minute during streams
	 * @type {number}
	 */
	public bpm?: number;

	/**
	 * The beatmap's drain length measured in seconds
	 * @type {number}
	 */
	public length?: number;

	/**
	 * The beatmap's approach rate
	 * @type {number}
	 */
	public ar?: number;

	/**
	 * The beatmap's overall difficulty
	 * @type {number}
	 */
	public od?: number;

	/**
	 * The beatmap's difficulty
	 * @type {number}
	 */
	public stars?: number;

	public constructor(bpm: number, length: number, oppaiStatistics: { ar: number, od: number, stars: number }) {
		this.bpm = Math.round(bpm * 1.5);
		this.length = Math.round(length * 2 / 3);
		this.ar = Number(oppaiStatistics.ar.toFixed(1));
		this.od = Number(oppaiStatistics.od.toFixed(1));
		this.stars = Number(oppaiStatistics.stars.toFixed(2));
	}

}

export default DoubleTimeBeatmap;