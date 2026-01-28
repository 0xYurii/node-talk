import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { listUsers, followUser } from '../controllers/userController';

const router = Router();

router.use(requireAuth);

router.get('/', listUsers);
router.post('/:id/follow', followUser);

export default router;
