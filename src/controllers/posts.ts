import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';

//get feed
export const getFeed = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return res.redirect('/auth/login');
    const userId = req.user.id;

    //A. find how i'm following
    const following = await prisma.follow.findMany({
        where: { followerId: userId, status: 'ACCEPTED' },
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
            authorId: req.user.id,
        },
    });

    res.redirect('/posts');
});

//delete post
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
    const postId = Number(req.params.id);

    //security check
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });

    if (!post || post.authorId !== req.user.id) {
        return res.status(403).send('Unauthorized');
    }

    await prisma.post.delete({ where: { id: postId } });
    res.redirect('/posts');
});

//Toggle like
export const toggleLike = asyncHandler(async (req: Request, res: Response) => {
    const postId = Number(req.params.id);
    const myId = req.user.id;

    const existingLike = await prisma.like.findUnique({
        where: {
            userId_postId: {
                userId: myId,
                postId: postId,
            },
        },
    });

    if (existingLike) {
        //unlike it
        await prisma.like.delete({
            where: {
                userId_postId: {
                    userId: myId,
                    postId: postId,
                },
            },
        });
    } else {
        //like it
        await prisma.like.create({
            data: {
                userId: myId,
                postId: postId,
            },
        });
    }

    // return the user where they came from
    const referer = req.headers.referer || '/posts';
    res.redirect(referer);
});

//creat a comment
export const creatComment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const postId = Number(req.params.id);
    const { content } = req.body;

    if (!content || content.trim() == '') {
        return res.status(400).redirect(`/posts/${postId}`);
    }

    await prisma.comment.create({
        data: {
            content: content,
            userId: userId,
            postId: postId,
        },
    });
    res.redirect(`/posts/${postId}`);
});

//get single post
export const getPostDetails = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const post = res.locals.post;

    const postWithComments = await prisma.post.findUnique({
        where: { id: post.id },
        include: {
            user: { select: { username: true, avatarUrl: true } },
            comments: {
                include: { user: { select: { username: true, avatarUrl: true } } },
                orderBy: { createdAt: 'asc' },
            },
            _count: { select: { likes: true, comments: true } },
            likes: { where: { userId: userId }, select: { id: true } },
        },
    });

    if (!postWithComments) return res.status(404).send('Post not found');

    res.render('posts/show', { post: postWithComments, comments: postWithComments.comments });
});
