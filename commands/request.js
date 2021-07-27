const dictionary = require('../dictionary');
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
        let request = {filters: [], modFilters: []};
        const bpm = formatNumberRange("bpm", params[0], 5);
        if (bpm) {
            request.modFilters.push(bpm);
            request["bpm"] = bpm;
            let mod = "none";
            for (let i = 1; i < params.length; i++) {
                if (params[i].includes('=')) {
                    let param = params[i].split("=");
                    if (params.length >= 2) {
                        switch (param[0]) {
                            case "average":
                                const average = formatNumberRange("average", param[1], 2);
                                if (average) {
                                    request.filters.push(average);
                                    break;
                                } else {
                                    return dictionary.commandIncorrectParams;
                                }
                            case "stars":
                                const stars = formatNumberRange("stars", param[1], 0.5);
                                if (stars) {
                                    request.modFilters.push(stars);
                                    break;
                                } else {
                                    return dictionary.commandIncorrectParams;
                                }
                            case "ar":
                                const ar = formatNumberRange("ar", param[1], 0.5);
                                if (ar) {
                                    request.modFilters.push(ar);
                                    break;
                                } else {
                                    return dictionary.commandIncorrectParams;
                                }
                            case "density":
                                const density = formatNumberRange("density", param[1], 0.1);
                                if (density) {
                                    request.filters.push(density);
                                    break;
                                } else {
                                    return dictionary.commandIncorrectParams;
                                }
                            case "length":
                                const length = formatNumberRange("length", param[1], 5);
                                if (length) {
                                    request.modFilters.push(length);
                                    break;
                                } else {
                                    return dictionary.commandIncorrectParams;
                                }
                            case "cs":
                                const cs = formatNumberRange("cs", param[1], 0.5);
                                if (cs) {
                                    request.filters.push(cs);
                                    break;
                                } else {
                                    return dictionary.commandIncorrectParams;
                                }
                            case "od":
                                const od = formatNumberRange("od", param[1], 0.5);
                                if (od) {
                                    request.modFilters.push(od);
                                    break;
                                } else {
                                    return dictionary.commandIncorrectParams;
                                }
                            default:
                                return dictionary.commandIncorrectParams;
                        }
                    } else {
                        return dictionary.commandIncorrectParams;
                    }
                } else {
                    switch (params[i]) {
                        case "dt":
                            mod = "dt";
                            break;
                        case "nomod":
                            mod = "nomod"
                            break;
                        case "r":
                            request.filters.push({osuStatus: "ranked"});
                            break;
                        case "ranked":
                            request.filters.push({osuStatus: "ranked"});
                            break;
                        case "l":
                            request.filters.push({osuStatus: "loved"});
                            break;
                        case "loved":
                            request.filters.push({osuStatus: "loved"});
                            break;
                        case "u":
                            request.filters.push({osuStatus: "unranked"});
                            break;
                        case "unranked":
                            request.filters.push({osuStatus: "unranked"});
                            break;
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
                }
            }
            request["mod"] = mod;
            const response = await sharedResources.requestServer(request, 'bot/request');
            if (response) {
                const modBeatmap = response.mod;
                const beatmap = response.beatmap;
                let seconds = beatmap.length % 60;
                if (seconds < 10) {
                    seconds = `0${seconds}`;
                }
                let additionalMods = "";
                if (modBeatmap === "dt") {
                    additionalMods = " +DT |"
                }
                const date = new Date();
                if(date.getUTCDate()===27 && date.getUTCMonth() === 6)
                {
                    return (`[https://osu.ppy.sh/b/${beatmap.beatmapId} Blue Zenith [FOUR DIMENSIONS]]`).concat(` ${additionalMods} BPM: ${beatmap.bpm} | `,
                        `${dictionary.type}: ${beatmap.type} | ${dictionary.averageStreamLength}: ${beatmap.average} | ${dictionary.density}: ${beatmap.density} | `,
                        `${beatmap.stars} ★ | AR: ${beatmap.ar} | OD: ${beatmap.od} | CS: ${beatmap.cs} | ${dictionary.status}: ${beatmap.osuStatus} | `,
                        `${dictionary.length}: ${Math.floor(beatmap.length / 60)}:${seconds}`);
                }
                return (`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.name}]`).concat(` ${additionalMods} BPM: ${beatmap.bpm} | `,
                    `${dictionary.type}: ${beatmap.type} | ${dictionary.averageStreamLength}: ${beatmap.average} | ${dictionary.density}: ${beatmap.density} | `,
                    `${beatmap.stars} ★ | AR: ${beatmap.ar} | OD: ${beatmap.od} | CS: ${beatmap.cs} | ${dictionary.status}: ${beatmap.osuStatus} | `,
                    `${dictionary.length}: ${Math.floor(beatmap.length / 60)}:${seconds}`);
            } else {
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