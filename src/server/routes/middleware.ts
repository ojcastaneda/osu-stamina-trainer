import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';

const superAdminMiddleware = async (request: Request, response: Response, next: NextFunction) => {
	try {
		let token = request.headers['authorization'];
		token = token!.slice(7, token!.length);
		const decoded = await jwt.verify(token, process.env.SECRET_KEY!) as {
			id: number,
			role: string
		};
		if (decoded) {
			if (decoded.role! === 'bot' || decoded.role === 'super_admin')
				return next();
			return response.status(403).send('User not authorized');
		}
	} catch (error) {
		return response.status(403).send('User not authorized');
	}
};

const adminMiddleware = async (request: Request, response: Response, next: NextFunction) => {
	try {
		let token = request.headers['authorization'];
		if (token) {
			if (token.startsWith('Bearer ')) {
				token = token.slice(7, token.length);
				const decoded = await jwt.verify(token, process.env.SECRET_KEY!);
				if (decoded)
					return next();
				return response.status(403).send('User not authorized');
			}
		}
		return response.status(403).send('No authentication token provided');
	} catch (error) {
		return response.status(403).send('User not authorized');
	}
};

const optionalAdminMiddleware = async (request: Request, response: Response, next: NextFunction) => {
	try {
		request.body.is_admin = false;
		let token = request.headers['authorization'];
		if (token)
			if (token.startsWith('Bearer ')) {
				token = token.slice(7, token.length);
				const decoded = await jwt.verify(token, process.env.SECRET_KEY!);
				if (decoded) request.body.is_admin = true;
			}
		next();
	} catch (error) {
		next();
	}
};

export {superAdminMiddleware, adminMiddleware, optionalAdminMiddleware};