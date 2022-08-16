use argon2::password_hash;
use axum::{
    extract::rejection::{ExtensionRejection, TypedHeaderRejection},
    http::{header::InvalidHeaderValue, StatusCode},
    response::{IntoResponse, Response},
};
use ost_utils::{beatmaps_processor, osu_api, storage};
use redis::RedisError;
use std::{error, fmt};
use tokio::io;

#[derive(Debug)]
pub enum Error {
    Authorization,
    BeatmapProcessor(beatmaps_processor::Error),
    Database(sqlx::Error),
    Extension(ExtensionRejection),
    FileStorage(storage::Error),
    HeaderValue(InvalidHeaderValue),
    IO(io::Error),
    OsuApi(osu_api::Error),
    PasswordHash(password_hash::Error),
    Redis(RedisError),
    TypedHeader(TypedHeaderRejection),
}

impl error::Error for Error {}

impl fmt::Display for Error {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Authorization => write!(formatter, "User not authorized."),
            Self::BeatmapProcessor(beatmaps_processor) => beatmaps_processor.fmt(formatter),
            Self::Database(database) => database.fmt(formatter),
            Self::Extension(extension) => extension.fmt(formatter),
            Self::FileStorage(storage) => storage.fmt(formatter),
            Self::HeaderValue(header_value) => header_value.fmt(formatter),
            Self::IO(io) => io.fmt(formatter),
            Self::OsuApi(osu_api) => osu_api.fmt(formatter),
            Self::PasswordHash(password_hash) => password_hash.fmt(formatter),
            Self::Redis(redis) => redis.fmt(formatter),
            Self::TypedHeader(type_header) => type_header.fmt(formatter),
        }
    }
}

impl From<beatmaps_processor::Error> for Error {
    fn from(error: beatmaps_processor::Error) -> Self {
        Self::BeatmapProcessor(error)
    }
}

impl From<sqlx::Error> for Error {
    fn from(error: sqlx::Error) -> Self {
        Self::Database(error)
    }
}

impl From<ExtensionRejection> for Error {
    fn from(error: ExtensionRejection) -> Self {
        Self::Extension(error)
    }
}

impl From<storage::Error> for Error {
    fn from(error: storage::Error) -> Self {
        Self::FileStorage(error)
    }
}

impl From<InvalidHeaderValue> for Error {
    fn from(error: InvalidHeaderValue) -> Self {
        Self::HeaderValue(error)
    }
}

impl From<io::Error> for Error {
    fn from(error: io::Error) -> Self {
        Self::IO(error)
    }
}

impl From<osu_api::Error> for Error {
    fn from(error: osu_api::Error) -> Self {
        Self::OsuApi(error)
    }
}

impl From<password_hash::Error> for Error {
    fn from(error: password_hash::Error) -> Self {
        Self::PasswordHash(error)
    }
}

impl From<RedisError> for Error {
    fn from(error: RedisError) -> Self {
        Self::Redis(error)
    }
}

impl From<TypedHeaderRejection> for Error {
    fn from(error: TypedHeaderRejection) -> Self {
        Self::TypedHeader(error)
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status_code = if let Self::Authorization = self {
            StatusCode::UNAUTHORIZED
        } else {
            tracing::error!("{:?}", self);
            StatusCode::INTERNAL_SERVER_ERROR
        };
        (
            status_code,
            match self {
                Self::Authorization => "User not authorized.",
                Self::BeatmapProcessor(_) => "An error ocurred while processing a beatmap.",
                Self::Database(_) => "An error ocurred while performing a database transaction.",
                Self::Extension(_) => {
                    "An error ocurred during the initial configuration of services."
                }
                Self::FileStorage(_) => {
                    "An error ocurred while performing a file storage transaction."
                }
                Self::HeaderValue(_) => "An error ocurred while setting a response header.",
                Self::IO(_) => "An error ocurred while performing an IO operation.",
                Self::OsuApi(_) => "An error ocurred while performing an osu! API request.",
                Self::PasswordHash(_) => {
                    "An error ocurred while performing a password hashing operation."
                }
                Self::Redis(_) => "An error ocurred while performing a cache transaction.",
                Self::TypedHeader(_) => "An error ocurred while trying to ",
            },
        )
            .into_response()
    }
}
