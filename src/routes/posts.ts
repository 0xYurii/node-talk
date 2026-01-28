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
const postRoute = Router();

// Protect ALL routes here
postRoute.use(requireAuth);

//VIEWING
postRoute.get('/', getFeed);
postRoute.get('/:id', getPostDetails);

// INTERACTIONS
postRoute.post('/', createPost);
postRoute.post('/:id/delete', deletePost);
postRoute.post('/:id/comments', creatComment);
postRoute.post('/:id/like', toggleLike);

//export route
export default postRoute;
