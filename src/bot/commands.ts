import dictionary from './dictionary';
import request from './request';

/**
 * Generates a response message based on the provided command.
 *
 * @param message - The command provided.
 * @returns A promise of the response message.
 */
const commandProcessing = async (message: string): Promise<string> => {
	message = message.toLowerCase();
	if (message.charAt(0) === '!') {
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
