import dictionary from './dictionary';
import ApiService from '../processing/services/api';
import request from './request';

const prefix = '!';

const commandProcessing = async (message: string, apiService: ApiService) => {
	message = message.toLowerCase();
	if (message.charAt(0) === prefix) {
		message = message.substring(1);
		const params = message.split(' ');
		const command = params.shift();
		switch (command) {
			case 'request':
				console.log(await request(params, apiService));
				return await request(params, apiService);
			case 'r':
				return await request(params, apiService);
			case 'submit':
				return dictionary.submit;
			case 'help':
				return dictionary.help;
			default:
				return dictionary.commandNotFound;
		}
	} else {
		return dictionary.commandNoPrefix;
	}
};

export default commandProcessing;

