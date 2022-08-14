use crate::ServerResult;

use super::{order::OrderOperator, Limit};
use serde::{Deserialize, Serialize};
use sqlx::{
    query, query_as,
    types::chrono::{DateTime, Utc},
    FromRow, Pool, Postgres, Type,
};

#[derive(Clone, Copy, Deserialize, Serialize, Type)]
#[sqlx(type_name = "enum_approval_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum ApprovalStatus {
    Approved,
    Pending,
    Processing,
}

#[derive(FromRow, Serialize)]
pub struct Submission {
    pub approval_status: ApprovalStatus,
    pub beatmapset_id: i32,
    pub id: i32,
    pub last_updated: DateTime<Utc>,
    pub title: String,
}

#[derive(FromRow, Serialize)]
pub struct SubmissionPagination {
    pub limit: i64,
    pub submissions: Vec<Submission>,
}

pub async fn approve(database: &Pool<Postgres>, id: i32) -> ServerResult<bool> {
    let rows = query(r#"UPDATE submissions SET approval_status = $1 WHERE id = $2"#)
        .bind(ApprovalStatus::Processing)
        .bind(id)
        .execute(database)
        .await?
        .rows_affected();
    Ok(rows > 0)
}

pub async fn delete(database: &Pool<Postgres>, id: i32) -> ServerResult<bool> {
    let mut transaction = database.begin().await?;
    let rows = query(r#"DELETE FROM submissions WHERE id = $1"#)
        .bind(id)
        .execute(&mut transaction)
        .await?
        .rows_affected();
    if rows > 0 {
        query(r#"DELETE FROM beatmaps WHERE id = $1"#)
            .bind(id)
            .execute(&mut transaction)
            .await?;
    }
    transaction.commit().await?;
    Ok(rows > 0)
}

pub async fn retrieve_by_page(
    database: &Pool<Postgres>,
    filter: Option<ApprovalStatus>,
    order: OrderOperator,
    page: i32,
    title: Option<String>,
) -> ServerResult<SubmissionPagination> {
    let filters = match (filter.is_some(), title.is_some()) {
        (true, true) => "WHERE approval_status = $1 AND title ILIKE CONCAT('%', $2, '%')",
        (true, false) => "WHERE approval_status = $1",
        (false, true) => "WHERE title ILIKE CONCAT('%', $1, '%')",
        (false, false) => "",
    };
    let submissions_sql = format!(
        r#"SELECT * FROM submissions {filters}
            ORDER BY last_updated {}, id DESC
            LIMIT 12 OFFSET ${}"#,
        match order {
            OrderOperator::Ascending => "ASC",
            OrderOperator::Descending => "DESC",
        },
        match (filter.is_some(), title.is_some()) {
            (true, true) => 3,
            (false, false) => 1,
            _ => 2,
        }
    );
    let mut submissions = query_as::<_, Submission>(&submissions_sql);
    let limit_sql = format!(r#"SELECT COUNT(id) as limit FROM submissions {filters}"#);
    let mut limit = query_as::<_, Limit>(&limit_sql);
    if let Some(approval_status) = filter {
        (submissions, limit) = (
            submissions.bind(approval_status),
            limit.bind(approval_status),
        );
    }
    if let Some(title) = title {
        (submissions, limit) = (submissions.bind(title.clone()), limit.bind(title));
    }
    submissions = submissions.bind((page - 1) * 12);
    let mut transaction = database.begin().await?;
    let page_limit = limit.fetch_one(&mut transaction).await?.limit;
    let pagination = SubmissionPagination {
        limit: (page_limit / 12)
            + if page_limit % 12 == 0 && page_limit != 0 {
                0
            } else {
                1
            },
        submissions: submissions.fetch_all(&mut transaction).await?,
    };
    transaction.commit().await?;
    Ok(pagination)
}
