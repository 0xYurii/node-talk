import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';

//discover users to follow
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
    //exlcude me
    const myId = (req.user as any).id;
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
    const myId = (req.user as any).id;
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
