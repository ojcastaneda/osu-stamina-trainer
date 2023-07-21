ALTER TABLE beatmaps DROP CONSTRAINT beatmaps_longest_stream_check;
ALTER TABLE beatmaps ADD CONSTRAINT beatmaps_longest_stream_check CHECK (longest_stream >= 2);
ALTER TABLE beatmaps DROP CONSTRAINT beatmaps_streams_length_check;
ALTER TABLE beatmaps ADD CONSTRAINT beatmaps_streams_length_check CHECK (streams_length >= 2);
