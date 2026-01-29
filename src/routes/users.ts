import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import {
    listUsers,
    followUser,
    getUserPofile,
    listFollowRequests,
    acceptFollowRequest,
    rejectFollowRequest,
} from '../controllers/userController';

const router = Router();

router.use(requireAuth);

router.get('/', listUsers);
router.get('/requests', listFollowRequests);
router.post('/requests/:id/accept', acceptFollowRequest);
router.post('/requests/:id/reject', rejectFollowRequest);
router.post('/:id/follow', followUser);
router.get('/:username', getUserPofile);

export default router;
