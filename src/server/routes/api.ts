import {requestToken} from '../logic/authentication';
import expressRateLimit from 'express-rate-limit';
import webRouter from './web';
import {Router} from 'express';

const router = Router();

router.use('/web', [expressRateLimit({windowMs: 300000, max: 300, message: 'Too many requests'}), webRouter]);

router.post('/requestToken', expressRateLimit({windowMs: 900000, max: 30, message: 'Too many requests'}), requestToken);

export default router;
