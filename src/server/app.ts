import express, {NextFunction, Request, Response} from 'express';
import {generatePassword} from './logic/authentication';
import FileManager from './logic/fileManager';
import apiRouter from './routes/api.router';
import Database from './models/database';
import User from './models/user';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use('/api', apiRouter);
app.use((request: Request, response: Response, next: NextFunction) => {
	return next(response.status(404).send('Page not found'));
});
app.use((error: Error, request: Request, response: Response, next: NextFunction) => {
		if (!response.headersSent) response.status(400).send(error.message);
	}
);

const serverSetup = async (): Promise<void> => {
	try {
		await Database.setupConnection(false);
		await FileManager.setup();
		const password = await generatePassword(process.env.DEFAULT_PASSWORD!);
		const baseAdmin = await User.retrieveUser(1);
		if (baseAdmin)
			await User.updateUser({
				id: 1,
				username: process.env.DEFAULT_USERNAME,
				password: password,
				role: 'super_admin'
			});
		else await User.createUser({username: process.env.DEFAULT_USERNAME, password: password, role: 'super_admin'});
		console.log('DB connected');
		await app.listen(process.env.PORT || '3001');
		console.log('Server live');
	} catch (error) {
		console.log(error);
	}
};

export default serverSetup;