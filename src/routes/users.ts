import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { uploads } from '../config/multer';
import {
    listUsers,
    followUser,
    getUserPofile,
    listFollowRequests,
    acceptFollowRequest,
    rejectFollowRequest,
    getEditProfile,
    updateProfile,
} from '../controllers/userController';

const router = Router();

router.use(requireAuth);

// Define specific routes BEFORE dynamic ones
router.get('/settings', getEditProfile);
router.post('/settings', uploads.single('avatar'), updateProfile);
router.get('/requests', listFollowRequests);
router.post('/requests/:id/accept', acceptFollowRequest);
router.post('/requests/:id/reject', rejectFollowRequest);

router.get('/', listUsers);
router.post('/:id/follow', followUser);
router.get('/:username', getUserPofile);

export default router;
