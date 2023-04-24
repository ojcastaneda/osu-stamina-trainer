use crate::{models::moderator, Error, ServerResult};
use axum::{
    async_trait,
    extract::FromRequestParts,
    headers::Cookie,
    http::{header::SET_COOKIE, request::Parts, HeaderMap, HeaderValue, StatusCode},
    response::IntoResponse,
    routing::{delete, post},
    Extension, Json, Router, TypedHeader,
};
use base64::engine::{general_purpose::STANDARD, Engine as _};
use rand_core::{OsRng, RngCore};
use redis::{aio::ConnectionManager, AsyncCommands};
use serde::Deserialize;
use sqlx::{Pool, Postgres};

const SESSION_COOKIE: &str = "ost-session";
const SESSION_CACHE_EXPIRATION: usize = 1_209_600;

#[derive(Deserialize)]
pub struct AuthenticationCredentials {
    pub password: String,
    pub username: String,
}

pub struct Session {
    pub id: i32,
    pub cookie: String,
}

#[async_trait]
impl<S> FromRequestParts<S> for Session
where
    S: Send + Sync,
{
    type Rejection = Error;

    async fn from_request_parts(request: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let Extension(mut cache) =
            Extension::<ConnectionManager>::from_request_parts(request, state).await?;
        let cookies = TypedHeader::<Cookie>::from_request_parts(request, state)
            .await
            .map_err(|_| Error::Authorization)?;
        let cookie = cookies.get(SESSION_COOKIE).ok_or(Error::Authorization)?;
        if let Ok(id) = cache.get::<String, i32>(String::from(cookie)).await {
            return Ok(Session {
                id,
                cookie: String::from(cookie),
            });
        }

        Err(Error::Authorization)
    }
}

async fn create_session(
    cache: &mut ConnectionManager,
    headers: &mut HeaderMap,
    id: i32,
) -> ServerResult<()> {
    let mut session_bytes = Vec::from([0u8; 64]);
    OsRng.fill_bytes(&mut session_bytes);
    let session = STANDARD.encode(session_bytes);
    let cookie = format!("{SESSION_COOKIE}={session}; SameSite=Strict; Path=/");
    cache.set_ex(session, id, SESSION_CACHE_EXPIRATION).await?;
    headers.insert(SET_COOKIE, HeaderValue::from_str(&cookie)?);
    Ok(())
}

async fn login(
    Extension(mut cache): Extension<ConnectionManager>,
    Extension(database): Extension<Pool<Postgres>>,
    Json(payload): Json<AuthenticationCredentials>,
) -> ServerResult<impl IntoResponse> {
    if let Some(moderator) =
        moderator::retrieve_from_credentials(&database, &payload.password, &payload.username)
            .await?
    {
        let mut headers = HeaderMap::new();
        create_session(&mut cache, &mut headers, moderator.id).await?;
        return Ok((StatusCode::NO_CONTENT, headers).into_response());
    }
    Ok(StatusCode::UNAUTHORIZED.into_response())
}
async fn logout(
    Extension(mut cache): Extension<ConnectionManager>,
    session: Session,
) -> ServerResult<impl IntoResponse> {
    cache.del(session.cookie).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn refresh(
    Extension(mut cache): Extension<ConnectionManager>,
    session: Session,
) -> ServerResult<impl IntoResponse> {
    cache.del(session.cookie).await?;
    let mut headers = HeaderMap::new();
    create_session(&mut cache, &mut headers, session.id).await?;
    Ok((StatusCode::NO_CONTENT, headers))
}

pub fn authentication_routes() -> Router {
    Router::new()
        .route("/login", post(login))
        .route("/logout", delete(logout))
        .route("/refresh", post(refresh))
}
