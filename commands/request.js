const sharedResources = require('./sharedResources');
const dictionary = require('../dictionary');

const ranges = {
	ar: 0.5,
	average: 2,
	bpm: 5,
	cs: 0.5,
	density: 0.1,
	length: 5,
	od: 0.5,
	stars: 0.5
};

const processNumericParameter = (name, parameter, format) => {
	if (parameter && ranges.hasOwnProperty(name))
		switch (format) {
			case 'exact':
				const number = parameter.slice(0, -1);
				if (!isNaN(number)) {
					const number = parseFloat(parameter);
					if (number >= 0 && number <= Number.MAX_SAFE_INTEGER) return {
						filterProperty: name,
						value: number,
						operator: 'exact'
					};
				}
				break;
			case 'minimum':
				if (!isNaN(parameter)) {
					const number = parseFloat(parameter);
					if (number >= 0 && number <= Number.MAX_SAFE_INTEGER) return {
						filterProperty: name,
						value: number,
						operator: 'minimum'
					};
				}
				break;
			case 'maximum':
				if (!isNaN(parameter)) {
					const number = parseFloat(parameter);
					if (number >= 0 && number <= Number.MAX_SAFE_INTEGER) return {
						filterProperty: name,
						value: number,
						operator: 'maximum'
					};
				}
				break;
			default:
				return;
		}
};

const processValueParameter = (parameter) => {
	if (parameter) {
		switch (parameter[0]) {
			case 'b':
				return {filterProperty: 'average', value: 8, operator: 'maximum'};
			case 's':
				return {filterProperty: 'average', value: 24, operator: 'maximum'};
			case 'd':
				return {filterProperty: 'average', value: 25, operator: 'minimum'};
			case 'r':
				return {filterProperty: 'ranked_status', value: 'ranked', operator: 'exact'};
			case 'u':
				return {filterProperty: 'ranked_status', value: 'unranked', operator: 'exact'};
			case 'l':
				return {filterProperty: 'ranked_status', value: 'loved', operator: 'exact'};
		}
	}
};

const processParameter = (fullParameter) => {
	if (fullParameter.indexOf('=') > 0) {
		let index = fullParameter.indexOf('=');
		const name = fullParameter.slice(0, index);
		let parameter = fullParameter.slice(index + 1);
		index = parameter.indexOf('-');
		if (index < 0) {
			parameter = [Number(parameter) - ranges[name], Number(parameter) + ranges[name]];
			return [processNumericParameter(name, parameter[0], 'minimum'), processNumericParameter(name, parameter[1], 'maximum')];
		} else if (index === parameter.length - 1) {
			return [processNumericParameter(name, parameter, 'exact')];
		} else {
			parameter = parameter.split('-');
			return [processNumericParameter(name, parameter[0], 'minimum'), processNumericParameter(name, parameter[1], 'maximum')];
		}
	} else if (fullParameter.indexOf('<') > 0) {
		const index = fullParameter.indexOf('<');
		const name = fullParameter.slice(0, index);
		const parameter = fullParameter.slice(index + 1);
		return [processNumericParameter(name, parameter, 'maximum')];

	} else if (fullParameter.indexOf('>') > 0) {
		const index = fullParameter.indexOf('>');
		const name = fullParameter.slice(0, index);
		const parameter = fullParameter.slice(index + 1);
		return [processNumericParameter(name, parameter, 'minimum')];
	}
	return [processValueParameter(fullParameter)];

};

const makeResponse = (requestResponse) => {
	const {beatmap, isDoubleTime} = requestResponse;
	let seconds = beatmap.length % 60;
	if (seconds < 10) seconds = `0${seconds}`;
	let additionalMods = '', type;
	if (isDoubleTime) additionalMods = ' +DT |';
	if(beatmap.average<9)
		type = 'bursts';
	else if(beatmap.average<25)
		type = 'streams'
	else
		type = 'deathstreams';
	const date = new Date();
	const response = `${additionalMods} BPM: ${beatmap.bpm} | `.concat(`${dictionary.type}: ${type} | `,
		`${dictionary.averageStreamLength}: ${beatmap.average} | ${dictionary.density}: ${beatmap.density} | ${beatmap.stars} ★ | AR: ${beatmap.ar} | `,
		`OD: ${beatmap.od} | CS: ${beatmap.cs} | ${dictionary.status}: ${beatmap.ranked_status} | `,
		`${dictionary.length}: ${Math.floor(beatmap.length / 60)}:${seconds}`);
	if (date.getUTCDate() === 27 && date.getUTCMonth() === 6)
		return (`[https://osu.ppy.sh/b/${beatmap.id} Blue Zenith [FOUR DIMENSIONS]]`).concat(response);
	console.log((`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.name}]`).concat(response));
	return (`[https://osu.ppy.sh/b/${beatmap.id} ${beatmap.name}]`).concat(response);
};

const request = async (params) => {
	params = params.filter((param) => param != null);
	if (params.length > 0) {
		let request = {filters: []};
		if (params[0][0] === '<' || params[0][0] === '>') params[0] = `bpm${params[0]}`;
		else params[0] = `bpm=${params[0]}`;
		const bpm = processParameter(params[0]);
		if (bpm) {
			request.filters = request.filters.concat(bpm);
			for (let i = 1; i < params.length; i++) {
				switch (params[i]) {
					case 'nomod':
						request.isDoubleTime = false;
						break;
					case 'dt':
						request.isDoubleTime = true;
						break;
					default:
						try {
							const processedParameter = processParameter(params[i]);
							if (!processedParameter.includes(null) && !processedParameter.includes(undefined)) request.filters = request.filters.concat(processedParameter);
							else return dictionary.commandIncorrectParams;
						} catch (error) {
							return dictionary.commandIncorrectParams;
						}
						break;
				}
			}
			try{

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
			catch (e) {
				console.log(request);
				console.log(e);
			}

		}
	}
	return dictionary.commandIncorrectParams;
};

module.exports = request;