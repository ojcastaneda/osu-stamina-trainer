DROP TABLE IF EXISTS table_users,
    table_submissions,
    table_double_time_beatmaps,
    table_beatmaps
    CASCADE;

DROP TYPE IF EXISTS enum_ranked_status,
    enum_user_roles,
    enum_approved_status;