/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} file
* @param {number | undefined} minimum_bpm
* @param {number | undefined} maximum_bpm
* @returns {BeatmapStatistics | undefined}
*/
export function process_beatmap(file: Uint8Array, minimum_bpm?: number, maximum_bpm?: number): BeatmapStatistics | undefined;
/**
* @param {any} js_beatmaps
* @param {boolean} use_bpm_division
* @param {boolean} generate_osdb
* @returns {Uint8Array}
*/
export function generate_collection(js_beatmaps: any, use_bpm_division: boolean, generate_osdb: boolean): Uint8Array;
/**
*/
export class BeatmapStatistics {
  free(): void;
/**
*/
  ar_double_time: number;
/**
*/
  average_stream_length: number;
/**
*/
  difficulty_double_time: number;
/**
*/
  od_double_time: number;
/**
*/
  stream_density: number;
/**
*/
  suggested_bpm: number;
}
