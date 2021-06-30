const fetch = require('cross-fetch');

const osuTokenRequest = async () => {
    const response = await fetch("https://osu.ppy.sh/oauth/token", {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "grant_type": "client_credentials",
            "client_id": process.env.BOT_ID,
            "client_secret": process.env.BOT_SECRET,
            "scope": "public"
        })
    });
    global.osuRequestHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await response.json()).token}`
    };
}

const serverTokenRequest = async () => {
    const response = await fetch(`${process.env.SERVER_API}auth/login`, {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "username": process.env.SERVER_USERNAME,
            "password": process.env.SERVER_PASSWORD
        })
    });
    global.serverRequestHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await response.json()).token}`
    };
}

module.exports = {osuTokenRequest, serverTokenRequest};