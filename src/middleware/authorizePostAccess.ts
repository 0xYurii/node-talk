import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

export const authorizePostAccess = async (req: Request, res: Response, next: NextFunction) => {
    const postId = Number(req.params.id);
    if (Number.isNaN(postId)) {
        return res.status(400).send('Invalid post id');
    }

    const userId = req.user?.id;
    if (!userId) return res.redirect('/auth/login');

    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            user: {
                select: { id: true, username: true, avatarUrl: true, isPrivate: true },
            },
            _count: { select: { likes: true, comments: true } },
            likes: { where: { userId }, select: { id: true } },
        },
    });

    if (!post) return res.status(404).send('Post not found');

    const isAuthor = post.authorId === userId;
    if (isAuthor || !post.user.isPrivate) {
        res.locals.post = post;
        return next();
    }

    const acceptedFollow = await prisma.follow.findFirst({
        where: { followerId: userId, followingId: post.authorId, status: 'ACCEPTED' },
        select: { id: true },
    });

    if (!acceptedFollow) {
        return res.status(403).send('Forbidden');
    }

    res.locals.post = post;
    return next();
};
