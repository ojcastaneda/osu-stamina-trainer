import {checkUser, createUser, Role, updateUser} from './models/user';
import express, {NextFunction, Request, Response} from 'express';
import {setupDatabaseConnection} from './models/database';
import {generatePassword} from './logic/authentication';
import {setupCloudStorage} from './logic/fileManager';
import apiRouter from './routes/api';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

/**
 * Initializes the server, the database tables, the cloud storage and the base user.
 */
const serverSetup = async (): Promise<void> => {
	await setupDatabaseConnection();
	await setupCloudStorage();
	const password = await generatePassword(process.env.DEFAULT_PASSWORD!);
	if (await checkUser(1)) {
		await updateUser({id: 1, username: process.env.DEFAULT_USERNAME, password: password, role: Role.super_admin});
	} else {
		await createUser({username: process.env.DEFAULT_USERNAME, password: password, role: Role.super_admin});
	}
	console.info('DB connected');
	const app = express();
	app.use(helmet());
	app.use(cors());
	app.use(morgan('tiny'));
	app.use(express.json());
	app.use('/api', apiRouter);
	app.use((request: Request, response: Response, next: NextFunction) => next(response.status(404).send('Page not found')));
	app.use((error: Error, request: Request, response: Response, next: NextFunction) => {
		if (!response.headersSent) response.status(400).send(error.message);
	});
	app.listen(process.env.PORT || '3001');
	console.info('Server live');
};

export default serverSetup;
