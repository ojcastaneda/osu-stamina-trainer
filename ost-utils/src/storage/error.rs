use aws_sdk_s3::{
    operation::delete_object::DeleteObjectError, operation::get_object::GetObjectError,
    operation::put_object::PutObjectError,
};
use aws_smithy_http::{byte_stream, result::SdkError};
use std::{env::VarError, error, fmt};

/// Represents the different types of errors that can occur while using the `Client`.
#[derive(Debug)]
pub enum Error {
    /// An error related to creating a `ByteStream` for a request body.
    ByteStream(byte_stream::error::Error),
    /// An error related to deleting an object from the S3 bucket.
    DeleteObject(String),
    /// An error related to retrieving an object from the S3 bucket.
    GetObject(String),
    /// An error related to uploading an object to the S3 bucket.
    PutObject(String),
    /// An error related to serializing or deserializing JSON data.
    SerdeJson(serde_json::Error),
    /// An error related to accessing an environment variable.
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

impl From<byte_stream::error::Error> for Error {
    fn from(error: byte_stream::error::Error) -> Self {
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
