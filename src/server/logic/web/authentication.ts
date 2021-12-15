import { NextFunction, Request, Response } from 'express';
import { generatePassword } from '../authentication';
import { createUser } from '../../models/user';

/**
 * Creates a submission with the provided username. password and role in the database if the username is not already registered.
 * 
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const registerUser = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const { username, password, role }: { username: string; password: string; role: string } = request.body;
		const generatedPassword = await generatePassword(password);
		if (generatedPassword === undefined) return response.status(400).send('Invalid password')
		await createUser({ username, password: generatedPassword, role });
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

export { registerUser };
