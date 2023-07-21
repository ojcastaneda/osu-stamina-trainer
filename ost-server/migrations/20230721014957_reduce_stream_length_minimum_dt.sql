ALTER TABLE double_time_beatmaps DROP CONSTRAINT double_time_beatmaps_longest_stream_check;
ALTER TABLE double_time_beatmaps ADD CONSTRAINT double_time_beatmaps_longest_stream_check CHECK (longest_stream >= 2);
ALTER TABLE double_time_beatmaps DROP CONSTRAINT double_time_beatmaps_streams_length_check;
ALTER TABLE double_time_beatmaps ADD CONSTRAINT double_time_beatmaps_streams_length_check CHECK (streams_length >= 2);
