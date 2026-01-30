import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { uploads } from '../config/multer';
import { validate } from '../middleware/validate';
import { idParamSchema, paginationSchema, usernameParamSchema } from '../validators/common';
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
router.post('/requests/:id/accept', validate(idParamSchema, 'params'), acceptFollowRequest);
router.post('/requests/:id/reject', validate(idParamSchema, 'params'), rejectFollowRequest);

router.get('/', validate(paginationSchema, 'query'), listUsers);
router.post('/:id/follow', validate(idParamSchema, 'params'), followUser);
router.get('/:username', validate(usernameParamSchema, 'params'), getUserPofile);

export default router;
