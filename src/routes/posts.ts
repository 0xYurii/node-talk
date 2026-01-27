import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getFeed, createPost, deletePost } from '../controllers/posts';
const postRoute = Router();

// Protect ALL routes here
postRoute.use(requireAuth);

postRoute.get('/', getFeed);
postRoute.post('/', createPost);
postRoute.post('/:id/delete', deletePost);

export default postRoute;
