# osu! stamina trainer monorepo
[![Development discord](https://discordapp.com/api/guilds/860588898857254933/widget.png?style=shield)](https://discord.gg/ppy)

Monorepo for the [osu! Stamina Trainer](https://ost.sombrax79.org) project.

This project is an osu! standard recommendation system for stamina intensive beatmaps.

## Repositories

- ost-bot: Discord and osu! bot for beatmap recommendations.
- ost-server: Backend of the project.
- ost-tasks: Updater of collection based using the osu! API.
- ost-utils: Library for shared resources of ost-server and ost-tasks.
- ost-website: Website of the project.

## Main Technologies

- Deployment: [AWS S3](https://aws.amazon.com/s3/), [Digital Ocean](https://www.digitalocean.com/) and [Docker](https://www.docker.com/).
- ost-bot: [bancho.js](https://bancho.js.org/) and [discord.js](https://discord.js.org/).
- ost-server: [axum](https://github.com/tokio-rs/axum) and [SQLx](https://github.com/launchbadge/sqlx).
- ost-tasks: [SQLx](https://github.com/launchbadge/sqlx).
- ost-utils: [reqwest](https://github.com/seanmonstar/reqwest) and [rosu-pp](https://github.com/MaxOhn/rosu-pp).
- ost-website: [NEXTjs](https://nextjs.org/) and [i18next](https://www.i18next.com/).