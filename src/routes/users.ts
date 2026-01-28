import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { listUsers, followUser, getUserPofile } from '../controllers/userController';
import { get } from 'https';

const router = Router();

router.use(requireAuth);

router.get('/', listUsers);
router.post('/:id/follow', followUser);
router.get('/:username', getUserPofile);

export default router;
