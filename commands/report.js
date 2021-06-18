const sharedResources = require('./sharedResources');

const report = (params) => {
    const beatmap = params.filter(sharedResources.filterMessage)[0];
    if (beatmap) {
        //WIP
    }
    return sharedResources.incorrectParams;
};

module.exports = report;