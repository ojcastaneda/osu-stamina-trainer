import { parseNowPlaying } from '../src/commands/analyze';

test('Now playing parsing', () => {
	const nowPlaying = parseNowPlaying(
		'is listening to [osu.ppy.sh/beatmapsets/297698#/873295 Tomatsu Haruka - courage]'
	);
	expect(nowPlaying).toStrictEqual(873295);
});
