const sharedResources = require('./sharedResources');
const dictionary = require('../dictionary/en.json');

const recommend = (user, params) => {
    const beatmap = params.filter(sharedResources.filterMessage)[0];
    if (beatmap) {
        sharedResources.searchBeatmapServer(user, beatmap).then((response) => {
                if (response) {
                    sharedResources.createRecommendationServer(user, {
                        beatmapID: response.id
                    })
                } else {
                    user.sendMessage(dictionary.mapNotAvailable);
                }
            }
        )
    } else {
        return dictionary.incorrectParams;
    }
};

module.exports = recommend;