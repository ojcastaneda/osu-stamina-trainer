import { NextFunction, Request, Response } from 'express';
import { hash, genSalt, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import User from '../models/user';

const generatePassword = async (password: string): Promise<string | undefined> => {
	if (password) return hash(password, await genSalt(10));
};

const generateToken = (user: User) => {
	const expiration = new Date();
	expiration.setTime(expiration.getTime() + 90000000);
	const token = sign({ role: user.role }, process.env.SECRET_KEY!, { expiresIn: '26h' });
	return {
		role: user.role,
		token: token,
		expiration: expiration
	};
};

const requestToken = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const { username, password }: { username: string; password: string } = request.body;
		const user = await User.retrieveUserByUsername(username, ['password', 'role']);
		if (user) {
			const result = await compare(password, user.password!);
			if (result) return response.status(200).json(generateToken(user));
			return response.status(404).send('Incorrect credentials');
		}
		return response.status(404).send('Incorrect credentials');
	} catch (error) {
		return next(error);
	}
};

export { generatePassword, requestToken };
