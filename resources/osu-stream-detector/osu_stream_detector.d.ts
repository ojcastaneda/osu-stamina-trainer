/* tslint:disable */
/* eslint-disable */
/**
* @param {string} file
* @param {number | undefined} minimum_bpm
* @param {number | undefined} maximum_bpm
* @returns {Beatmap | undefined}
*/
export function process_beatmap(file: string, minimum_bpm?: number, maximum_bpm?: number): Beatmap | undefined;
/**
*/
export class Beatmap {
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
