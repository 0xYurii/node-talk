import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import {
    getFeed,
    createPost,
    deletePost,
    toggleLike,
    creatComment,
    getPostDetails,
} from '../controllers/posts';
import { authorizePostAccess } from '../middleware/authorizePostAccess';
const postRoute = Router();

// Protect ALL routes here
postRoute.use(requireAuth);

//VIEWING
postRoute.get('/', getFeed);
postRoute.get('/:id', authorizePostAccess, getPostDetails);

// INTERACTIONS
postRoute.post('/', createPost);
postRoute.post('/:id/delete', authorizePostAccess, deletePost);
postRoute.post('/:id/comments', authorizePostAccess, creatComment);
postRoute.post('/:id/like', authorizePostAccess, toggleLike);

//export route
export default postRoute;
