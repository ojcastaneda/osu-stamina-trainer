mod authentication;
mod beatmap;
mod bot;
mod moderator;
mod submission;

use authentication::authentication_routes;
use axum::Router;
use beatmap::beatmap_routes;
use bot::bot_routes;
use moderator::moderator_routes;
use submission::submission_routes;

pub fn api_routes() -> Router {
    Router::new()
        .nest("/authentication", authentication_routes())
        .nest("/beatmap", beatmap_routes())
        .nest("/bot", bot_routes())
        .nest("/moderator", moderator_routes())
        .nest("/submission", submission_routes())
}
