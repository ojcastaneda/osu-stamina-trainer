CREATE TYPE enum_approval_status AS ENUM ('approved', 'pending', 'processing');
CREATE TYPE enum_ranked_status AS ENUM ('loved', 'ranked', 'unranked');

CREATE TABLE beatmaps (
    id INTEGER PRIMARY KEY CHECK (id >= 1),
    accuracy REAL NOT NULL CHECK (accuracy >= 0),
    approach_rate REAL NOT NULL CHECK (approach_rate >= 0),
    beatmapset_id INTEGER NOT NULL CHECK (beatmapset_id >= 1),
    bpm SMALLINT NOT NULL CHECK (bpm >= 100),
    checksum CHAR(32) NOT NULL,
    circle_size REAL NOT NULL CHECK (circle_size >= 0),
    difficulty_rating REAL NOT NULL CHECK (difficulty_rating >= 0),
    favorite_count INTEGER NOT NULL CHECK (favorite_count >= 0),
    last_requested TIMESTAMP(0) WITH TIME ZONE,
    last_updated TIMESTAMP(0) WITH TIME ZONE NOT NULL,
    length SMALLINT NOT NULL CHECK (length >= 1),
    longest_stream SMALLINT NOT NULL CHECK (longest_stream >= 3),
    performance_100 SMALLINT NOT NULL CHECK (performance_100 >= 0),
    performance_95 SMALLINT NOT NULL CHECK (performance_95 >= 0),
    play_count INTEGER NOT NULL CHECK (play_count >= 0),
    ranked_status enum_ranked_status NOT NULL,
    streams_density REAL NOT NULL CHECK (streams_density >= 0.25),
    streams_length SMALLINT NOT NULL CHECK (streams_length >= 3),
    streams_spacing REAL NOT NULL CHECK (streams_spacing >= 0),
    title VARCHAR(255) NOT NULL
);

CREATE TABLE double_time_beatmaps (
    id INTEGER PRIMARY KEY CHECK (id >= 1),
    accuracy REAL NOT NULL CHECK (accuracy >= 0),
    approach_rate REAL NOT NULL CHECK (approach_rate >= 0),
    bpm SMALLINT NOT NULL CHECK (bpm >= 100),
    circle_size REAL NOT NULL CHECK (circle_size >= 0),
    difficulty_rating REAL NOT NULL CHECK (difficulty_rating >= 0),
    last_requested TIMESTAMP(0) WITH TIME ZONE,
    last_updated TIMESTAMP(0) WITH TIME ZONE NOT NULL,
    length SMALLINT NOT NULL CHECK (length >= 1),
    longest_stream SMALLINT NOT NULL CHECK (longest_stream >= 3),
    performance_100 SMALLINT NOT NULL CHECK (performance_100 >= 0),
    performance_95 SMALLINT NOT NULL CHECK (performance_95 >= 0),
    ranked_status enum_ranked_status NOT NULL,
    streams_density REAL NOT NULL CHECK (streams_density >= 0.25),
    streams_length SMALLINT NOT NULL CHECK (streams_length >= 3),
    streams_spacing REAL NOT NULL CHECK (streams_spacing >= 0),
    title VARCHAR(255) NOT NULL,
    CONSTRAINT fk_double_time_beatmaps_beatmaps FOREIGN KEY (id) REFERENCES beatmaps (id) ON DELETE CASCADE
);

CREATE TABLE submissions (
    id INTEGER PRIMARY KEY CHECK (id >= 1),
    approval_status enum_approval_status NOT NULL DEFAULT 'pending',
    beatmapset_id INTEGER NOT NULL CHECK (beatmapset_id >= 1),
    last_updated TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    title VARCHAR(255) NOT NULL
);

CREATE TABLE unchecked_submissions (
    id INTEGER PRIMARY KEY
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY CHECK (id >= 1),
    language CHAR(2) NOT NULL,
    username VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE moderators (
    id SERIAL PRIMARY KEY,
    password CHAR(96) NOT NULL,
    username VARCHAR(30) NOT NULL
);

CREATE INDEX ix_double_time_beatmaps_bpm_difficulty_rating_stream_length ON double_time_beatmaps USING btree (bpm, difficulty_rating, streams_length);

CREATE INDEX ix_beatmaps_bpm_difficulty_rating_stream_length ON beatmaps USING btree (bpm, difficulty_rating, streams_length);
