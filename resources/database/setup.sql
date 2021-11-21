DO
$$
    BEGIN
        CREATE TYPE enum_approved_status AS ENUM ('pending', 'pending_approved', 'approved');
        CREATE TYPE enum_user_roles AS ENUM ('super_admin', 'admin');
        CREATE TYPE enum_ranked_status AS ENUM ('ranked', 'loved', 'unranked');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;

CREATE TABLE IF NOT EXISTS table_beatmaps
(
    id             INTEGER PRIMARY KEY CHECK (id >= 1),
    set_id         INTEGER                     NOT NULL CHECK (set_id >= 1),
    favorites      INTEGER                     NOT NULL CHECK (favorites >= 0),
    bpm            SMALLINT                    NOT NULL CHECK (bpm >= 1),
    length         SMALLINT                    NOT NULL CHECK (length >= 1),
    average        SMALLINT                    NOT NULL CHECK (average >= 3),
    ar             DECIMAL(3, 1)               NOT NULL CHECK (ar >= 0),
    od             DECIMAL(3, 1)               NOT NULL CHECK (od >= 0),
    cs             DECIMAL(3, 1)               NOT NULL CHECK (cs >= 0),
    stars          DECIMAL(4, 2)               NOT NULL CHECK (stars >= 3),
    density        DECIMAL(3, 2)               NOT NULL CHECK (density >= 0.3),
    active_status  BOOLEAN                     NOT NULL DEFAULT TRUE,
    name           VARCHAR(200)                NOT NULL,
    hash           CHAR(32)                    NOT NULL,
    ranked_status  enum_ranked_status          NOT NULL,
    last_requested TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT 'epoch',
    last_updated   TIMESTAMP(0) WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS table_double_time_beatmaps
(
    id             INTEGER PRIMARY KEY CHECK (id >= 1),
    bpm            SMALLINT                    NOT NULL CHECK (bpm >= 1),
    length         SMALLINT                    NOT NULL CHECK (length >= 1),
    average        SMALLINT                    NOT NULL CHECK (average >= 3),
    ar             DECIMAL(3, 1)               NOT NULL CHECK (ar >= 0),
    od             DECIMAL(3, 1)               NOT NULL CHECK (od >= 0),
    cs             DECIMAL(3, 1)               NOT NULL CHECK (cs >= 0),
    stars          DECIMAL(4, 2)               NOT NULL CHECK (stars >= 3),
    density        DECIMAL(3, 2)               NOT NULL CHECK (density >= 0.3),
    active_status  BOOLEAN                     NOT NULL DEFAULT TRUE,
    name           VARCHAR(200)                NOT NULL,
    ranked_status  enum_ranked_status          NOT NULL,
    last_requested TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT TIMESTAMP 'epoch',
    last_updated   TIMESTAMP(0) WITH TIME ZONE NOT NULL,
    CONSTRAINT double_time_beatmaps_foreign_key
        FOREIGN KEY (id)
            REFERENCES table_beatmaps (id)
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS table_submissions
(
    id              INTEGER PRIMARY KEY CHECK (id >= 1),
    approved_status enum_approved_status        NOT NULL DEFAULT 'pending',
    last_updated    TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS table_users
(
    id       SERIAL PRIMARY KEY,
    username VARCHAR(30)     NOT NULL UNIQUE,
    password CHAR(60)        NOT NULL,
    role     enum_user_roles NOT NULL
);

CREATE INDEX IF NOT EXISTS index_double_time_beatmaps ON table_double_time_beatmaps USING btree (bpm, average, stars);
CREATE INDEX IF NOT EXISTS index_beatmaps ON table_beatmaps USING btree (bpm, average, stars);