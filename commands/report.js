const sharedResources = require('./sharedResources');
const dictionary = require('../dictionary/en.json');

const report = (user, params) => {
    const beatmap = params.filter(sharedResources.filterMessage)[0];
    if (beatmap) {
        sharedResources.searchBeatmapOsu(user, beatmap).then((response) => {
                if (response) {
                    sharedResources.createReportServer(user, {
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
}

module.exports = report;