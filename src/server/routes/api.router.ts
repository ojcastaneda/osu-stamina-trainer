import {requestToken} from '../logic/authentication';
import expressRateLimit from 'express-rate-limit';
import webRouter from './web.routes';
import {Router} from 'express';

const requestTokenLimit = expressRateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	message: 'Too many requests from this IP, please try again after 15 minutes'
});

const webLimit = expressRateLimit({
	windowMs: 5 * 60 * 1000,
	max: 300,
	message: 'Too many requests from this IP, please try again after 15 minutes'
});

const router = Router();

router.use('/web', [webLimit, webRouter]);

router.post('/requestToken', requestTokenLimit, requestToken);

export default router;
