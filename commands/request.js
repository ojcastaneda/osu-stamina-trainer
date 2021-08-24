const sharedResources = require('./sharedResources');
const dictionary = require('../dictionary');

const numericRequests = {
	ar: {range: 0.5, modification: true},
	average: {range: 2, modification: false},
	bpm: {range: 5, modification: true},
	cs: {range: 0.5, modification: false},
	density: {range: 0.1, modification: false},
	length: {range: 5, modification: true},
	od: {range: 0.5, modification: true},
	stars: {range: 0.5, modification: true}
};

const valueRequests = {
	r: {value: 'ranked', name: 'osuStatus'},
	ranked: {value: 'ranked', name: 'osuStatus'},
	l: {value: 'loved', name: 'osuStatus'},
	loved: {value: 'loved', name: 'osuStatus'},
	u: {value: 'unranked', name: 'osuStatus'},
	unranked: {value: 'unranked', name: 'osuStatus'},
	b: {value: 'bursts', name: 'type'},
	bursts: {value: 'bursts', name: 'type'},
	s: {value: 'streams', name: 'type'},
	streams: {value: 'streams', name: 'type'},
	d: {value: 'deathstreams', name: 'type'},
	deathstreams: {value: 'deathstreams', name: 'type'}
};

const processNumericParameter = (name, parameter, format) => {
	if (parameter && numericRequests.hasOwnProperty(name))
		switch (format) {
			case 'range':
				const numbers = parameter.split('-');
				if (numbers.length > 1)
					if (!isNaN(numbers[0]) && !isNaN(numbers[1])) {
						let min = parseFloat(numbers[0]);
						const max = parseFloat(numbers[1]);
						if (max >= 0 && min <= Number.MAX_SAFE_INTEGER && max >= min) {
							if (min < 0) min = 0;
							return {
								modification: numericRequests[name].modification,
								query: {
									name,
									min,
									max
								}
							};
						}

					}
				break;
			case 'exact':
				const number = parameter.slice(0, -1);
				if (!isNaN(number)) {
					const number = parseFloat(parameter);
					if (number >= 0 && number <= Number.MAX_SAFE_INTEGER) return {
						modification: numericRequests[name].modification,
						query: {
							name,
							min: number,
							max: number
						}
					};
				}
				break;
			case 'default':
				if (!isNaN(parameter)) {
					const number = parseFloat(parameter) + numericRequests[name].range;
					if (number >= 0 && number <= Number.MAX_SAFE_INTEGER) {
						let min = number - numericRequests[name].range * 2;
						if (min < 0) min = 0;
						return {
							modification: numericRequests[name].modification,
							query: {
								name,
								min,
								max: number
							}
						};

					}

				}
				break;
			case 'min':
				if (!isNaN(parameter)) {
					const number = parseFloat(parameter);
					if (number >= 0 && number <= Number.MAX_SAFE_INTEGER) return {
						modification: numericRequests[name].modification,
						query: {name, min: number}
					};
				}
				break;
			case 'max':
				if (!isNaN(parameter)) {
					const number = parseFloat(parameter);
					if (number >= 0 && number <= Number.MAX_SAFE_INTEGER) return {
						modification: numericRequests[name].modification,
						query: {name, max: number}
					};
				}
				break;
			default:
				return;
		}
};

const processValueParameter = (parameter) => {
	if (parameter != null && valueRequests.hasOwnProperty(parameter))
		return {stats: false, query: {name: valueRequests[parameter].name, value: valueRequests[parameter].value}};
};

const processParameter = (fullParameter) => {
	if (fullParameter.indexOf('=') > 0) {
		let index = fullParameter.indexOf('=');
		const name = fullParameter.slice(0, index);
		const parameter = fullParameter.slice(index + 1);
		index = parameter.indexOf('-');
		if (index < 0) {
			return processNumericParameter(name, parameter, 'default');
		} else if (index === parameter.length - 1) {
			return processNumericParameter(name, parameter, 'exact');
		} else {
			return processNumericParameter(name, parameter, 'range');
		}
	} else if (fullParameter.indexOf('<') > 0) {
		const index = fullParameter.indexOf('<');
		const name = fullParameter.slice(0, index);
		const parameter = fullParameter.slice(index + 1);
		return processNumericParameter(name, parameter, 'max');

	} else if (fullParameter.indexOf('>') > 0) {
		const index = fullParameter.indexOf('>');
		const name = fullParameter.slice(0, index);
		const parameter = fullParameter.slice(index + 1);
		return processNumericParameter(name, parameter, 'min');
	}
	return processValueParameter(fullParameter);

};

const makeResponse = (requestResponse) => {
	const modBeatmap = requestResponse.modification;
	const beatmap = requestResponse.beatmap;
	let seconds = beatmap.length % 60;
	if (seconds < 10) seconds = `0${seconds}`;
	let additionalMods = '';
	if (modBeatmap === 'doubleTime') additionalMods = ' +DT |';
	const date = new Date();
	const response = `${additionalMods} BPM: ${beatmap.bpm} | `.concat(`${dictionary.type}: ${beatmap.type} | `,
		`${dictionary.averageStreamLength}: ${beatmap.average} | ${dictionary.density}: ${beatmap.density} | ${beatmap.stars} ★ | AR: ${beatmap.ar} | `,
		`OD: ${beatmap.od} | CS: ${beatmap.cs} | ${dictionary.status}: ${beatmap.osuStatus} | `,
		`${dictionary.length}: ${Math.floor(beatmap.length / 60)}:${seconds}`);
	if (date.getUTCDate() === 27 && date.getUTCMonth() === 6)
		return (`[https://osu.ppy.sh/b/${beatmap.beatmapId} Blue Zenith [FOUR DIMENSIONS]]`).concat(response);
	return (`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.name}]`).concat(response);
};

const request = async (params) => {
	params = params.filter((param) => param != null);
	if (params.length > 0) {
		let request = {filters: [], modFilters: []};
		if (params[0][0] === '<' || params[0][0] === '>') params[0] = `bpm${params[0]}`;
		else params[0] = `bpm=${params[0]}`;
		const bpm = processParameter(params[0]);
		if (bpm) {
			request.modFilters.push(bpm.query);
			for (let i = 1; i < params.length; i++) {
				switch (params[i]) {
					case 'nomod':
						request.modification = 'noModification';
						break;
					case 'dt':
						request.modification = 'doubleTime';
						break;
					default:
						const processedParameter = processParameter(params[i]);
						if (processedParameter) {
							if (processedParameter.modification) request.modFilters.push(processedParameter.query);
							else request.filters.push(processedParameter.query);
						} else {
							return dictionary.commandIncorrectParams;
						}
						break;
				}
			}
			const requestResponse = await sharedResources.requestServer(request, 'bot/request');
			switch (requestResponse) {
				case 404:
					return dictionary.noBeatmapsFound;
				case 500:
					return dictionary.serverNotAvailable;
				case 400:
					return dictionary.commandIncorrectParams;
				default:
					return makeResponse(requestResponse);
			}
		}
	}
	return dictionary.commandIncorrectParams;
};

module.exports = request;