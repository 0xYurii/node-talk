import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validate } from '../middleware/validate';
import { idParamSchema, sendMessageSchema, startConversationSchema } from '../validators/common';
import {
    getConversations,
    getChat,
    startConversation,
    sendMessage,
} from '../controllers/chatController';

const router = Router();

router.use(requireAuth);

router.get('/', getConversations);
router.get('/:id', validate(idParamSchema, 'params'), getChat);
router.post('/', validate(startConversationSchema, 'body'), startConversation);
router.post(
    '/:id/messages',
    validate(idParamSchema, 'params'),
    validate(sendMessageSchema, 'body'),
    sendMessage,
);

export default router;
