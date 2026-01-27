import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';

//get feed
export const getFeed = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return res.redirect('/auth/login');
    const userId = (req.user as { id: number }).id;

    //A. find how i'm following
    const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
    });

    // extract only the Ids
    const followingIds = following.map((follow) => follow.followingId);

    //B. feed query
    // select posts where ID is me or someone i'm following
    const posts = await prisma.post.findMany({
        where: {
            authorId: {
                in: [...followingIds, userId],
            },
        },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { username: true, avatarUrl: true },
            },
            _count: {
                select: { likes: true, comments: true },
            },
            likes: {
                where: { userId: userId },
                select: { id: true },
            },
        },
    });
    res.render('posts/index', { posts });
});

//creat post
export const createPost = asyncHandler(async (req: Request, res: Response) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'title and content are required' });
    }

    await prisma.post.create({
        data: {
            title,
            content,
            authorId: (req.user! as { id: number }).id,
        },
    });

    res.redirect('/posts');
});

//delete post
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const postId = Number.parseInt(idParam, 10);

    //security check
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });

    if (!post || post.authorId !== (req.user! as { id: number }).id) {
        return res.status(403).send('Unauthorized');
    }

    await prisma.post.delete({ where: { id: postId } });
    res.redirect('/posts');
});
