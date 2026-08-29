ALTER TABLE beatmaps DROP CONSTRAINT IF EXISTS beatmaps_bpm_check;
ALTER TABLE beatmaps DROP CONSTRAINT IF EXISTS beatmaps_streams_density_check;
ALTER TABLE beatmaps DROP CONSTRAINT IF EXISTS beatmaps_longest_stream_check;
ALTER TABLE beatmaps DROP CONSTRAINT IF EXISTS beatmaps_streams_length_check;

ALTER TABLE double_time_beatmaps DROP CONSTRAINT IF EXISTS double_time_beatmaps_bpm_check;
ALTER TABLE double_time_beatmaps DROP CONSTRAINT IF EXISTS double_time_beatmaps_streams_density_check;
ALTER TABLE double_time_beatmaps DROP CONSTRAINT IF EXISTS double_time_beatmaps_longest_stream_check;
ALTER TABLE double_time_beatmaps DROP CONSTRAINT IF EXISTS double_time_beatmaps_streams_length_check;
