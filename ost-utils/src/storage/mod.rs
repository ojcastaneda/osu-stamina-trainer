mod error;
pub mod models;

use aws_config::from_env;
use aws_sdk_s3::types::ByteStream;
use std::env;

pub type Error = error::Error;

#[derive(Clone)]
pub struct Client {
    bucket: String,
    client: aws_sdk_s3::Client,
}

impl Client {
    pub async fn from_environment() -> Result<Self, Error> {
        Ok(Self {
            bucket: env::var("AWS_BUCKET")?,
            client: aws_sdk_s3::Client::new(&from_env().load().await),
        })
    }

    pub async fn delete(&self, key: impl Into<String>) -> Result<(), Error> {
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;
        Ok(())
    }

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
    use std::fs;

    const TEST_FILE: &str = "test.osu";

    #[tokio::test]
    async fn test_storage() {
        dotenv().ok();
        let client = Client::from_environment().await.unwrap();
        let file_content = fs::read("./test_files/test.osu").unwrap();
        assert!(client.upload(&file_content, TEST_FILE).await.is_ok());
        assert_eq!(client.retrieve(TEST_FILE).await.unwrap(), file_content);
        assert!(client.delete(TEST_FILE).await.is_ok());
        assert!(client.retrieve(TEST_FILE).await.is_err());
    }
}
