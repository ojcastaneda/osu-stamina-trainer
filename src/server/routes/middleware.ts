import {NextFunction, Request, Response} from 'express';
import {verify} from 'jsonwebtoken';

/**
 * Middleware for access restriction to non super administrator users.
 *
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const superAdminMiddleware = async (request: Request, response: Response, next: NextFunction) => {
	try {
		if (extractTokenRole(request) !== 'super_admin') return response.status(403).send('User not authorized');
		next();
	} catch (error) {
		return response.status(403).send('User not authorized');
	}
};

/**
 * Middleware for access restriction to non administrator users.
 *
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const adminMiddleware = async (request: Request, response: Response, next: NextFunction) => {
	try {
		if (extractTokenRole(request) === undefined) return response.status(403).send('User not authorized');
		next();
	} catch (error) {
		return response.status(403).send('User not authorized');
	}
};

/**
 * Middleware for indicating whether or not an user is an administrator.
 *
 * @param request - The express request.
 * @param response - The express response.
 * @param next - The express next function.
 */
const optionalAdminMiddleware = async (request: Request, response: Response, next: NextFunction) => {
	try {
		if (extractTokenRole(request) !== undefined) request.body.isAdmin = true;
		next();
	} catch (error) {
		next();
	}
};

/**
 * Extracts the role of the user that sent the request.
 *
 * @param request - The express request.
 * @returns A role associated with the request or undefined if not found.
 */
const extractTokenRole = (request: Request): string | undefined => {
	try {
		let token = request.headers['authorization'];
		if (!token || !token.startsWith('Bearer ')) return;
		token = token.slice(7, token.length);
		const decoded = verify(token, process.env.SECRET_KEY!) as { id: number; role: string };
		if (!decoded || decoded.role !== 'super_admin') return;
		return decoded.role;
	} catch (error) {}
};

export {superAdminMiddleware, adminMiddleware, optionalAdminMiddleware};
