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
        let request = {filters: [], modFilters: []};
        const bpm = formatNumberRange("bpm", params[0], 5);
        if (bpm) {
            request.modFilters.push(bpm);
            request["bpm"] = bpm;
            let mod = "none";
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
                    case "dt":
                        mod = "dt";
                        break;
                    case "nomod":
                        mod = "nomod"
                        break;
                    default:
                        return dictionary.commandIncorrectParams;
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
                    additionalMods = "+DT |"
                }
                return (`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.name}]`).concat(` ${additionalMods} BPM: ${beatmap.bpm} | `,
                    `${dictionary.type}: ${beatmap.type} | ${dictionary.density}: ${beatmap.density} | AR: ${beatmap.ar} | OD: ${beatmap.od} | `,
                    `CS: ${beatmap.cs} | ${dictionary.length}: ${Math.floor(beatmap.length / 60)}:${seconds} `,
                    `[https://discord.gg/eNU3BE6bca new update check the changes on Discord]`);
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