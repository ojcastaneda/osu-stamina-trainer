DO
$$
    BEGIN
        CREATE TYPE enum_approved AS ENUM ('pending', 'waiting_processing', 'approved');
        CREATE TYPE enum_roles AS ENUM ('super_admin', 'admin');
        CREATE TYPE enum_ranked AS ENUM ('ranked', 'loved', 'unranked');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;

CREATE TABLE IF NOT EXISTS beatmaps
(
    id                INTEGER PRIMARY KEY CHECK (id >= 1),
    beatmapset_id     INTEGER                     NOT NULL CHECK (beatmapset_id >= 1),
    favourite_count   INTEGER                     NOT NULL CHECK (favourite_count >= 0),
    play_count        INTEGER                     NOT NULL CHECK (play_count >= 0),
    bpm               SMALLINT                    NOT NULL CHECK (bpm >= 1),
    hit_length        SMALLINT                    NOT NULL CHECK (hit_length >= 1),
    stream_length     SMALLINT                    NOT NULL CHECK (stream_length >= 3),
    accuracy          FLOAT4                      NOT NULL CHECK (accuracy >= 0),
    ar                FLOAT4                      NOT NULL CHECK (ar >= 0),
    cs                FLOAT4                      NOT NULL CHECK (cs >= 0),
    stream_density    FLOAT4                      NOT NULL CHECK (stream_density >= 0.3),
    difficulty_rating FLOAT4                      NOT NULL CHECK (difficulty_rating >= 3),
    active            BOOLEAN                     NOT NULL DEFAULT TRUE,
    title             VARCHAR(255)                NOT NULL,
    checksum          CHAR(32)                    NOT NULL,
    ranked            enum_ranked                 NOT NULL,
    last_requested    TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT 'epoch',
    last_updated      TIMESTAMP(0) WITH TIME ZONE NOT NULL,
    last_verified     TIMESTAMP(0) WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS double_time_beatmaps
(
    id                INTEGER PRIMARY KEY CHECK (id >= 1),
    bpm               SMALLINT                    NOT NULL CHECK (bpm >= 1),
    hit_length        SMALLINT                    NOT NULL CHECK (hit_length >= 1),
    stream_length     SMALLINT                    NOT NULL CHECK (stream_length >= 3),
    accuracy          FLOAT4                      NOT NULL CHECK (accuracy >= 0),
    ar                FLOAT4                      NOT NULL CHECK (ar >= 0),
    cs                FLOAT4                      NOT NULL CHECK (cs >= 0),
    difficulty_rating FLOAT4                      NOT NULL CHECK (difficulty_rating >= 3),
    stream_density    FLOAT4                      NOT NULL CHECK (stream_density >= 0.3),
    active            BOOLEAN                     NOT NULL DEFAULT TRUE,
    title             VARCHAR(255)                NOT NULL,
    ranked            enum_ranked                 NOT NULL,
    last_requested    TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT TIMESTAMP 'epoch',
    last_updated      TIMESTAMP(0) WITH TIME ZONE NOT NULL,
    CONSTRAINT double_time_beatmaps_foreign_key
        FOREIGN KEY (id)
            REFERENCES beatmaps (id)
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions
(
    id           INTEGER PRIMARY KEY CHECK (id >= 1),
    approved     enum_approved               NOT NULL DEFAULT 'pending',
    last_updated TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users
(
    id       SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password CHAR(60)    NOT NULL,
    role     enum_roles  NOT NULL
);

CREATE INDEX IF NOT EXISTS index_double_time_beatmaps ON double_time_beatmaps USING btree (bpm, stream_length, difficulty_rating);
CREATE INDEX IF NOT EXISTS index_beatmaps ON beatmaps USING btree (bpm, stream_length, difficulty_rating);