use aws_sdk_s3::{
    error::{DeleteObjectError, GetObjectError, PutObjectError},
    types::SdkError,
};
use aws_smithy_http::byte_stream;
use std::{env::VarError, error, fmt};

#[derive(Debug)]
pub enum Error {
    ByteStream(byte_stream::Error),
    DeleteObject(String),
    GetObject(String),
    PutObject(String),
    SerdeJson(serde_json::Error),
    Var(VarError),
}

impl error::Error for Error {}

impl fmt::Display for Error {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ByteStream(byte_stream) => byte_stream.fmt(formatter),
            Self::DeleteObject(delete_object) => delete_object.fmt(formatter),
            Self::GetObject(get_object) => get_object.fmt(formatter),
            Self::PutObject(put_object) => put_object.fmt(formatter),
            Self::SerdeJson(serde_json) => serde_json.fmt(formatter),
            Self::Var(var) => var.fmt(formatter),
        }
    }
}

impl From<byte_stream::Error> for Error {
    fn from(error: byte_stream::Error) -> Self {
        Self::ByteStream(error)
    }
}

impl From<SdkError<DeleteObjectError>> for Error {
    fn from(error: SdkError<DeleteObjectError>) -> Self {
        Self::DeleteObject(error.to_string())
    }
}

impl From<SdkError<GetObjectError>> for Error {
    fn from(error: SdkError<GetObjectError>) -> Self {
        Self::GetObject(error.to_string())
    }
}

impl From<SdkError<PutObjectError>> for Error {
    fn from(error: SdkError<PutObjectError>) -> Self {
        Self::PutObject(error.to_string())
    }
}

impl From<serde_json::Error> for Error {
    fn from(error: serde_json::Error) -> Self {
        Self::SerdeJson(error)
    }
}

impl From<VarError> for Error {
    fn from(error: VarError) -> Self {
        Self::Var(error)
    }
}
