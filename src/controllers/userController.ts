import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';

//discover users to follow
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
    //exlcude me
    const myId = req.user.id;
    //exclude who i'm following
    const following = await prisma.follow.findMany({
        where: { followerId: myId },
        select: { followingId: true },
    });

    //map to get only get the Ids
    const onlyFollowingId = following.map((f) => f.followingId);

    // 2. Fetch users who are NOT me and NOT in my following list
    const users = await prisma.user.findMany({
        where: {
            AND: [{ id: { not: myId } }, { id: { notIn: onlyFollowingId } }],
        },
        take: 20,
        select: { id: true, username: true, avatarUrl: true },
    });

    res.render('users/index', { users });
});

// follow users
export const followUser = asyncHandler(async (req: Request, res: Response) => {
    const targetId = parseInt((req.params as any).id);
    const myId = req.user.id;
    if (targetId == myId) {
        return res.status(400).send('You cannot follow yourself.');
    }

    await prisma.follow.upsert({
        where: {
            followerId_followingId: {
                followerId: myId,
                followingId: targetId,
            },
        },
        create: {
            followerId: myId,
            followingId: targetId,
            status: 'ACCEPTED',
        },
        update: {},
    });
    res.redirect('/users');
});

//get a User Profile
export const getUserPofile = asyncHandler(async (req: Request, res: Response) => {
    const myId = req.user.id;
    const username = (req.params as any).username;

    //fetch user information + the relation
    const user = await prisma.user.findUnique({
        where: { username: username },
        include: {
            posts: {
                orderBy: { createdAt: 'asc' },
                include: {
                    user: { select: { username: true, avatarUrl: true } },
                    _count: { select: { likes: true, comments: true } },
                },
            },
            _count: { select: { followers: true, following: true } },

            //check if I follow him
            followers: {
                where: { followerId: myId },
            },
        },
    });

    if (!user) return res.status(404).render('404', { message: 'User not found' });

    //check personl relation
    const isMe = user.id === myId;
    const isFollowing = user.followers.length > 0;

    res.render('users/show', { profileUser: user, isMe, isFollowing });
});
