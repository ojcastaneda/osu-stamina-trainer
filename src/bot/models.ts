import Beatmap from '../processing/models/api/beatmap';

class Filter {
	public filterProperty: string;

	public operator: string;

	public value: any;

	constructor(filterProperty: string, operator: string, value: any) {
		this.filterProperty = filterProperty;
		this.operator = operator;
		this.value = value;
	}
}

class Request {
	public filters: Filter[];

	public isDoubleTime: boolean | undefined;

	constructor() {
		this.filters = [];
	}
}

class RequestResponse {
	public isDoubleTime!: boolean;

	public beatmap!: Beatmap
}

export {Filter, Request, RequestResponse};