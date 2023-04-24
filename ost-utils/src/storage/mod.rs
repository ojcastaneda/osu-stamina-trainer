mod error;
pub mod models;

use aws_config::from_env;
use aws_smithy_http::byte_stream::ByteStream;
use std::env;

pub type Error = error::Error;

#[derive(Clone)]
pub struct Client {
    /// The name of the AWS S3 bucket that the client interacts with.
    bucket: String,
    /// An instance of [`Client`](`aws_sdk_s3::Client`) that provides access to the AWS S3 API.
    client: aws_sdk_s3::Client,
}

impl Client {
    /// Creates a new [`Client`] instance from environment variables.
    ///
    /// This method retrieves the name of the AWS S3 bucket from the `AWS_BUCKET` environment variable and
    /// creates a new [`Client`](`aws_sdk_s3::Client`) instance with the credentials loaded from the environment.
    ///
    /// Returns an error if either the `AWS_BUCKET` environment variable is not set or if the
    /// [`Client`](`aws_sdk_s3::Client`) instance cannot be created due to missing or invalid credentials.
    pub async fn from_environment() -> Result<Self, Error> {
        Ok(Self {
            bucket: env::var("AWS_BUCKET")?,
            client: aws_sdk_s3::Client::new(&from_env().load().await),
        })
    }

    /// Deletes an object from the AWS S3 bucket with the specified `key`.
    ///
    /// Returns an error if the object cannot be deleted, e.g., because the bucket or the object does not exist.
    pub async fn delete(&self, key: impl Into<String>) -> Result<(), Error> {
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;
        Ok(())
    }

    /// Retrieves an object from the AWS S3 bucket with the specified `key`.
    ///
    /// Returns the contents of the object as a [`Vec<u8>`] or an error if the object cannot be retrieved,
    /// e.g., because the bucket or the object does not exist.
    pub async fn retrieve(&self, key: impl Into<String>) -> Result<Vec<u8>, Error> {
        Ok(self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?
            .body
            .collect()
            .await?
            .into_bytes()
            .into_iter()
            .collect())
    }

    /// Uploads the `content` data to the AWS S3 bucket,
    /// with the specified `key` determining the location within the bucket where the `content` will be stored.
    ///
    /// If the upload is successful, returns `Result` with `Ok(())`.
    /// If the upload fails, returns `Result` with `Err` containing the error.
    pub async fn upload(&self, content: &[u8], key: impl Into<String>) -> Result<(), Error> {
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(ByteStream::new(content.into()))
            .send()
            .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::storage::Client;
    use dotenv::dotenv;
    use std::{error::Error, fs};

    const TEST_FILE: &str = "test.osu";

    /// Test to verify the functionality of the [`Client`]'s `upload`, `retrieve`, and `delete` methods.
    ///
    /// The test reads a file `./test_files/test.osu`, uploads it to the S3 bucket using the `upload` method,
    /// retrieves it using the `retrieve` method, and then deletes it using the `delete` method.
    /// The contents of the file are verified to match the uploaded and retrieved data.
    /// The `retrieve` method is also used after the file has been deleted to ensure that it has been successfully deleted.
    #[tokio::test]
    async fn test_storage() -> Result<(), Box<dyn Error>> {
        dotenv().ok();
        let client = Client::from_environment().await?;
        let file_content = fs::read("./test_files/test.osu")?;
        assert!(client.upload(&file_content, TEST_FILE).await.is_ok());
        assert_eq!(client.retrieve(TEST_FILE).await?, file_content);
        assert!(client.delete(TEST_FILE).await.is_ok());
        assert!(client.retrieve(TEST_FILE).await.is_err());
        Ok(())
    }
}
