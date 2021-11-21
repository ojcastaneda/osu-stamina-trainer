import {
	approveSubmission,
	createSubmission,
	deleteSubmission,
	retrieveFilteredSubmissionsByPage
} from '../logic/web/submissions.logic';
import {retrieveCollectionFile, retrieveFilteredBeatmapsByPage, updateBeatmapStatus} from '../logic/web/beatmaps.logic';
import {adminMiddleware, optionalAdminMiddleware, superAdminMiddleware} from './middleware';
import expressRateLimit from 'express-rate-limit';
import {Router} from 'express';
import {registerUser} from '../logic/web/authentication';

const router = Router({mergeParams: true});

const downloadLimit = expressRateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	message: 'Too many requests from this IP, please try again after 15 minutes'
});

router.post('/register', superAdminMiddleware, registerUser);

router.get('/collection', downloadLimit, retrieveCollectionFile);

router.post('/beatmaps/ByPage', optionalAdminMiddleware, retrieveFilteredBeatmapsByPage);

router.put('/beatmaps/:id/status', adminMiddleware, updateBeatmapStatus);

router.post('/submissions', createSubmission);

router.post('/submissions/byPage', adminMiddleware, retrieveFilteredSubmissionsByPage);

router.put('/submissions/:id/approve', adminMiddleware, approveSubmission);

router.delete('/submissions/:id', adminMiddleware, deleteSubmission);

export default router;