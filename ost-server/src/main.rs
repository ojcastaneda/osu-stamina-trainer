mod collection_generator;
mod error;
mod models;
mod routes;

use axum::{Extension, Router, Server};
use dotenv::dotenv;
use ost_utils::{osu_api, storage};
use redis::aio::ConnectionManager;
use sqlx::postgres::PgPoolOptions;
use std::{env, net::SocketAddr};
use tower_http::trace::TraceLayer;
use tracing::info;
use tracing_subscriber::{
    filter::filter_fn, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt, Layer,
};

use crate::models::moderator;

pub type Error = error::Error;
pub type ServerResult<T> = Result<T, Error>;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database = PgPoolOptions::new()
        .connect(&env::var("DATABASE_URL")?)
        .await?;
    if moderator::retrieve(&database, 1).await?.is_some() {
        moderator::update_username(&database, 1, env::var("BASE_USERNAME")?).await?;
        moderator::update_password(&database, 1, env::var("BASE_PASSWORD")?).await?;
    } else {
        moderator::create(
            &database,
            env::var("BASE_PASSWORD")?,
            env::var("BASE_USERNAME")?,
        )
        .await?;
    }
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::fmt::layer()
                .compact()
                .with_target(false)
                .with_filter(filter_fn(|metadata| {
                    metadata.target().starts_with("tower_http") || metadata.target() == "ost_server"
                })),
        )
        .init();
    let app = Router::new()
        .nest("/api", routes::api_routes())
        .layer(TraceLayer::new_for_http())
        .layer(Extension(database))
        .layer(Extension(
            ConnectionManager::new(redis::Client::open(env::var("REDIS_URL")?)?).await?,
        ))
        .layer(Extension(storage::Client::from_environment().await?))
        .layer(Extension(osu_api::Client::from_environment(5)?));
    let socket_address = SocketAddr::from((
        if cfg!(debug_assertions) {
            [127, 0, 0, 1]
        } else {
            [0, 0, 0, 0]
        },
        8080,
    ));
    info!("Listening on {socket_address}");
    Server::bind(&socket_address)
        .serve(app.into_make_service())
        .await?;
    info!("Server closed");
    Ok(())
}
