import { approveSubmissionWeb, createSubmissionWeb, deleteSubmissionWeb, retrieveSubmissionsByPageWeb } from '../logic/web/submissions.logic';
import { retrieveCollectionFileWeb, retrieveBeatmapsByPageWeb, updateBeatmapStatusWeb } from '../logic/web/beatmaps.logic';
import { adminMiddleware, optionalAdminMiddleware, superAdminMiddleware } from './middleware';
import { registerUser } from '../logic/web/authentication';
import expressRateLimit from 'express-rate-limit';
import { Router } from 'express';

const router = Router({ mergeParams: true });

router.post('/register', superAdminMiddleware, registerUser);

router.post('/beatmaps/ByPage', optionalAdminMiddleware, retrieveBeatmapsByPageWeb);

router.get('/collection', expressRateLimit({ windowMs: 900000, max: 5, message: 'Too many requests' }), retrieveCollectionFileWeb);

router.put('/beatmaps/:id/status', adminMiddleware, updateBeatmapStatusWeb);

router.post('/submissions', createSubmissionWeb);

router.post('/submissions/byPage', adminMiddleware, retrieveSubmissionsByPageWeb);

router.put('/submissions/:id/approve', adminMiddleware, approveSubmissionWeb);

router.delete('/submissions/:id', adminMiddleware, deleteSubmissionWeb);

export default router;
