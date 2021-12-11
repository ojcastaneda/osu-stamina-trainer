import dictionary from './dictionary';
import request from './request';

const prefix = '!';

const commandProcessing = async (message: string) => {
	message = message.toLowerCase();
	if (message.charAt(0) === prefix) {
		message = message.substring(1);
		const params = message.split(' ');
		const command = params.shift();
		switch (command) {
			case 'request':
				return await request(params);
			case 'r':
				return await request(params);
			case 'submit':
				return dictionary.submit;
			case 'help':
				return dictionary.help;
			default:
				return dictionary.commandNotFound;
		}
	} else return dictionary.commandNoPrefix;
};

export default commandProcessing;
