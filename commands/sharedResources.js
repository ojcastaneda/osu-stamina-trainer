const dictionary = require('../dictionary/en.json');
const fetch = require('cross-fetch');

const requestServer = async (body, url) => {
    let response = await fetch(process.env.SERVER_API + url, {
        method: 'POST',
        headers: global.serverRequestHeaders,
        body: JSON.stringify(body)
    })
    if (response.ok) {
        response = await response.json();
        return response;
    }
    return;
}

const searchBeatmapOsu = (user, beatmap) => {
    return fetch(`https://osu.ppy.sh/api/v2/beatmaps/${beatmap}`, {
        method: 'GET',
        headers: global.osuRequestHeaders
    }).then((response) => {
        if (response.ok) {
            return response.json().then((json) => {
                return json;
            });
        }
    }).catch(() => user.sendMessage(dictionary.osuNotAvailable));
}

const searchBeatmapServer = (user, beatmap) => {
    return fetch(`https://osu.ppy.sh/api/v2/beatmaps/${beatmap}`, {
        method: 'GET',
        headers: global.serverRequestHeaders
    }).then((response) => {
        if (response.ok) {
            return response.json().then((json) => {
                return json;
            });
        }
    }).catch(() => user.sendMessage(dictionary.osuNotAvailable));
}

const createRecommendationServer = (user, beatmapID) => {
    return fetch(`https://osu.ppy.sh/api/v2/recommendations`, {
        method: 'POST',
        headers: global.serverRequestHeaders,
        body: beatmapID
    }).catch(() => user.sendMessage(dictionary.serverNotAvailable));
}

const createReportServer = (user, beatmapID) => {
    return fetch(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapID}`, {
        method: 'POST',
        headers: global.serverRequestHeaders
    }).catch(() => user.sendMessage(dictionary.serverNotAvailable));
}

module.exports = {
    searchBeatmapOsu,
    searchBeatmapServer,
    createRecommendationServer,
    createReportServer,
    requestServer
};