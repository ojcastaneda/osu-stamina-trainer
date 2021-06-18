const sharedResources = require('./sharedResources').filterMessage;

const recommend = (params) => {
    const beatmap = params.filter(sharedResources.filterMessage)[0];
    if (beatmap) {
        //WIP
    }
    return sharedResources.incorrectParams;
};

module.exports = recommend;