import User, {retrieveUserByUsername} from '../models/user';
import {NextFunction, Request, Response} from 'express';
import {hash, genSalt, compare} from 'bcrypt';
import {sign} from 'jsonwebtoken';

/**
 * Generates the encrypted password to store in the database.
 *
 * @param password - The original password.
 * @returns A string of the encrypted password.
 */
const generatePassword = async (password: string): Promise<string | undefined> => (password ? hash(password, await genSalt(10)) : undefined);

/**
 * Generates a JWT that lasts 26 hours for a user.
 *
 * @param user - The user which is going to own the token.
 * @returns A object with the credentials of the role, token and expiration date.
 */
const generateToken = (user: User): { role: string; token: string; expiration: Date } => {
	const expiration = new Date();
	expiration.setTime(expiration.getTime() + 90000000);
	return {role: user.role!, token: sign({role: user.role}, process.env.SECRET_KEY!, {expiresIn: '26h'}), expiration: expiration};
};

/**
 * Attaches a token to the express response if the user with the provided credentials exists in the database.
 *
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const requestToken = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const {username, password}: { username: string; password: string } = request.body;
		const user = await retrieveUserByUsername(username, ['password', 'role']);
		if (user === undefined) return response.status(404).send('Incorrect credentials');
		const result = await compare(password, user.password!);
		if (result) return response.status(200).json(generateToken(user));
		response.status(404).send('Incorrect credentials');
	} catch (error) {
		return next(error);
	}
};

export {generatePassword, requestToken};
