import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';

// GET /chat -> List all conversations
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const conversations = await prisma.conversation.findMany({
        where: {
            participants: { some: { id: userId } },
        },
        include: {
            participants: {
                where: { id: { not: userId } },
                select: { username: true, avatarUrl: true },
            },
            messages: {
                take: 1,
                orderBy: { createdAt: 'asc' },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });

    res.render('chat/index', { conversations });
});

// GET /chat/:id -> Show messages in a specific conversation
export const getChat = asyncHandler(async (req: Request, res: Response) => {
    const conversationId = Number(req.params.id);
    const userId = req.user!.id;

    //security check insure i'm with them
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            participants: true,
            messages: {
                orderBy: { createdAt: 'asc' },
                include: { sender: true },
            },
        },
    });
    if (!conversation || !conversation.participants.some((p) => p.id === userId)) {
        return res.redirect('/chat');
    }

    // Mark messages from other users as read
    await prisma.message.updateMany({
        where: {
            conversationId,
            senderId: { not: userId },
            isRead: false,
        },
        data: { isRead: true },
    });
    res.render('chat/show', { conversation });
});

// POST /chat -> Start a conversation with a user
export const startConversation = asyncHandler(async (req: Request, res: Response) => {
    const myId = req.user!.id;
    const targetId = Number(req.body.targetId);

    //check if conversation already existed
    const existed = await prisma.conversation.findFirst({
        where: {
            AND: [
                { participants: { some: { id: myId } } },
                { participants: { some: { id: targetId } } },
            ],
        },
    });
    if (existed) {
        return res.redirect(`/chat/${existed.id}`);
    }
    const newConv = await prisma.conversation.create({
        data: {
            participants: {
                connect: [{ id: myId }, { id: targetId }],
            },
        },
    });
    res.redirect(`/chat/${newConv.id}`);
});

// POST /chat/:id/messages -> Send message
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const senderId = req.user!.id;
    const convId = Number(req.params.id);
    const content = req.body.content;

    //creat message
    const message = await prisma.message.create({
        data: {
            senderId,
            conversationId: convId,
            content,
        },
        include: {
            conversation: { include: { participants: true } },
        },
    });

    //update time
    await prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
    });

    // 🚀 REAL-TIME MAGIC
    const io = req.app.get('io');

    //notify every one in this conversation
    message.conversation.participants.forEach((p) => {
        if (p.id !== senderId) {
            //emit to everyone is this room
            io.to(`user_${p.id}`).emit('new message', {
                convId,
                content,
                sender: req.user!.username,
            });
        }
    });

    // If AJAX request, return JSON, else redirect
    if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json(message);
    }
    res.redirect(`/chat/${convId}`);
});
