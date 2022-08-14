use std::{env::VarError, error, fmt, num::ParseIntError};
use tokio::sync::AcquireError;

#[derive(Debug)]
pub enum Error {
    Acquire(AcquireError),
    ParseInt(ParseIntError),
    Reqwest(reqwest::Error),
    Var(VarError),
}

impl error::Error for Error {}

impl fmt::Display for Error {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Acquire(acquire) => acquire.fmt(formatter),
            Self::ParseInt(parse_int) => parse_int.fmt(formatter),
            Self::Reqwest(reqwest) => reqwest.fmt(formatter),
            Self::Var(var) => var.fmt(formatter),
        }
    }
}

impl From<AcquireError> for Error {
    fn from(error: AcquireError) -> Self {
        Self::Acquire(error)
    }
}

impl From<ParseIntError> for Error {
    fn from(error: ParseIntError) -> Self {
        Self::ParseInt(error)
    }
}

impl From<reqwest::Error> for Error {
    fn from(error: reqwest::Error) -> Self {
        Self::Reqwest(error)
    }
}

impl From<VarError> for Error {
    fn from(error: VarError) -> Self {
        Self::Var(error)
    }
}
