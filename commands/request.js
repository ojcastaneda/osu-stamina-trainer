const dictionary = require('../dictionary/en.json');
const sharedResources = require('./sharedResources');

const formatNumberRange = (name, param, defaultRange) => {
    if (param.includes('-')) {
        const range = param.split('-');
        let min, max;
        if (range[1]) {
            if (isNaN(range[0]) || isNaN(range[1]))
                return;
            min = parseFloat(range[0]);
            max = parseFloat(range[1]);
            if (min < 0 || max < min) {
                return;
            }
        } else {
            if (isNaN(range[0]))
                return;
            min = parseFloat(range[0]);
            max = min;
            if (min < 0 || max < min) {
                return;
            }

        }
        return {name: name, min: min, max: max};

    } else {
        if (isNaN(param))
            return;
        const number = parseFloat(param);
        const min = number - defaultRange;
        if (min < 0) {
            return;
        }
        const max = number + defaultRange;
        return {name: name, min: min, max: max};
    }
}

const request = async (params) => {
    if (params.length > 0) {
        let request = {filters: []};
        const bpm = formatNumberRange("bpm", params[0], 5);
        if (bpm) {
            request.filters.push(bpm);
            for (let i = 1; i < params.length; i++) {
                let param = params[i].split("=");
                switch (param[0]) {
                    case "type": {
                        switch (param[1]) {
                            case "b":
                                request.filters.push({type: "bursts"});
                                break;
                            case "bursts":
                                request.filters.push({type: "bursts"});
                                break;
                            case "s":
                                request.filters.push({type: "streams"});
                                break;
                            case "streams":
                                request.filters.push({type: "streams"});
                                break;
                            case "d":
                                request.filters.push({type: "deathstreams"});
                                break;
                            case "deathstreams":
                                request.filters.push({type: "deathstreams"});
                                break;
                            default:
                                return dictionary.commandIncorrectParams;
                        }
                        break;
                    }
                    case "stars":
                        const stars = formatNumberRange("stars", param[1], 0.5);
                        if (stars) {
                            request.filters.push(stars);
                            break;
                        } else {
                            return dictionary.commandIncorrectParams;
                        }
                    case "ar":
                        const ar = formatNumberRange("ar", param[1], 0.5);
                        if (ar) {
                            request.filters.push(ar);
                            break;
                        } else {
                            return dictionary.commandIncorrectParams;
                        }
                }
            }
            const response = await sharedResources.requestServer(request, 'bot/request');
            if (response)
                return `[https://osu.ppy.sh/b/${response.beatmapId} ${response.name}] BPM: ${response.bpm} ${dictionary.type}: ${response.type} \
                AR: ${response.ar} OD: ${response.od} ${dictionary.length}: ${Math.floor(response.length / 60)}:${response.length % 60}\
                [https://discord.gg/eNU3BE6bca new Discord server for suggestions]`;
            else {
                return dictionary.noBeatmapsFound;
            }
        } else {
            return dictionary.commandIncorrectParams;
        }

    } else {
        return dictionary.commandIncorrectParams;
    }

}

module.exports = request;