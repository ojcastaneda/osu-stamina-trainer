import {NextFunction, Request, Response} from 'express';
import {generatePassword} from '../authentication';
import User from '../../models/user';

const registerUser = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const {username, password, role}: { username: string, password: string, role: string } = request.body;
		await User.createUser({username, password: await generatePassword(password), role});
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

export {registerUser};