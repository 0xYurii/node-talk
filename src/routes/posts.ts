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
import { validate } from '../middleware/validate';
import { idParamSchema } from '../validators/common';
const postRoute = Router();

// Protect ALL routes here
postRoute.use(requireAuth);

//VIEWING
postRoute.get('/', getFeed);
postRoute.get('/:id', validate(idParamSchema, 'params'), authorizePostAccess, getPostDetails);

// INTERACTIONS
postRoute.post('/', createPost);
postRoute.post('/:id/delete', validate(idParamSchema, 'params'), authorizePostAccess, deletePost);
postRoute.post(
    '/:id/comments',
    validate(idParamSchema, 'params'),
    authorizePostAccess,
    creatComment,
);
postRoute.post('/:id/like', validate(idParamSchema, 'params'), authorizePostAccess, toggleLike);

//export route
export default postRoute;
