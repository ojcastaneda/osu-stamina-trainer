use rosu_pp::ParseError;
use std::{error, fmt, num::ParseIntError};

/// Represents the different types of errors that can occur while processing.
#[derive(Debug)]
pub enum Error {
    /// An error that occurs when parsing a beatmap.
    ParseBeatmap(ParseError),
    /// An error that occurs when parsing an integer value.
    ParseInt(ParseIntError),
}

impl error::Error for Error {}

impl fmt::Display for Error {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ParseBeatmap(parse_beatmap) => parse_beatmap.fmt(formatter),
            Self::ParseInt(parse_int) => parse_int.fmt(formatter),
        }
    }
}

impl From<ParseError> for Error {
    fn from(error: ParseError) -> Self {
        Self::ParseBeatmap(error)
    }
}

impl From<ParseIntError> for Error {
    fn from(error: ParseIntError) -> Self {
        Self::ParseInt(error)
    }
}
