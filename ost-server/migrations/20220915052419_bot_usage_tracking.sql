CREATE TABLE bot_tracking (
    date_id INTEGER PRIMARY KEY,
    unique_users INTEGER NOT NULL DEFAULT 0 CHECK (unique_users >= 0),
    interactions INTEGER NOT NULL DEFAULT 0 CHECK (interactions >= 0)
);
