import {approveSubmissionWeb, createSubmissionWeb, deleteSubmissionWeb, retrieveSubmissionsByPageWeb} from '../logic/web/submissions';
import {retrieveBeatmapsByPageWeb, updateBeatmapStatusWeb, generateCollectionFileWeb} from '../logic/web/beatmaps';
import {adminMiddleware, optionalAdminMiddleware, superAdminMiddleware} from './middleware';
import {registerUser} from '../logic/web/authentication';
import expressRateLimit from 'express-rate-limit';
import {Router} from 'express';

const router = Router({mergeParams: true});

router.post('/register', superAdminMiddleware, registerUser);

router.post('/beatmaps/ByPage', optionalAdminMiddleware, retrieveBeatmapsByPageWeb);

router.post('/collection', expressRateLimit({windowMs: 1800000, max: 10, message: 'Too many requests'}), generateCollectionFileWeb);

router.put('/beatmaps/:id/status', adminMiddleware, updateBeatmapStatusWeb);

router.post('/submissions', createSubmissionWeb);

router.post('/submissions/byPage', adminMiddleware, retrieveSubmissionsByPageWeb);

router.put('/submissions/:id/approve', adminMiddleware, approveSubmissionWeb);

router.delete('/submissions/:id', adminMiddleware, deleteSubmissionWeb);

export default router;
