use sqlx::{query, query_as, Pool, Postgres};

use crate::TaskResult;

use super::Submission;

pub async fn delete(database: &Pool<Postgres>, id: i32) -> TaskResult<()> {
    query(r#"DELETE FROM unchecked_submissions WHERE id = $1"#)
        .bind(id)
        .execute(database)
        .await?;
    Ok(())
}

pub async fn retrieve_all(database: &Pool<Postgres>) -> TaskResult<Vec<Submission>> {
    Ok(
        query_as::<_, Submission>(r#"SELECT id FROM unchecked_submissions"#)
            .fetch_all(database)
            .await?,
    )
}
