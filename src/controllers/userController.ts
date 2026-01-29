import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { supabase } from '../config/supabase';
import { updateProfileSchema } from '../validators/userValidator';

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

    const existingFollow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId: myId,
                followingId: targetId,
            },
        },
        select: { id: true, status: true },
    });

    if (existingFollow?.status === 'ACCEPTED') {
        await prisma.follow.delete({ where: { id: existingFollow.id } });
        return res.redirect('/users');
    }

    if (existingFollow) {
        await prisma.follow.update({
            where: { id: existingFollow.id },
            data: { status: 'PENDING' },
        });
        return res.redirect('/users');
    }

    await prisma.follow.create({
        data: {
            followerId: myId,
            followingId: targetId,
            status: 'PENDING',
        },
    });
    res.redirect('/users');
});

export const listFollowRequests = asyncHandler(async (req: Request, res: Response) => {
    const myId = req.user.id;

    const requests = await prisma.follow.findMany({
        where: { followingId: myId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: {
            follower: { select: { id: true, username: true, avatarUrl: true } },
        },
    });

    res.render('users/requests', { requests });
});

export const acceptFollowRequest = asyncHandler(async (req: Request, res: Response) => {
    const myId = req.user.id;
    const followId = parseInt((req.params as any).id);

    const request = await prisma.follow.findUnique({ where: { id: followId } });
    if (!request || request.followingId !== myId) {
        return res.status(404).render('404', { message: 'Follow request not found' });
    }

    await prisma.follow.update({
        where: { id: followId },
        data: { status: 'ACCEPTED' },
    });

    res.redirect('/users/requests');
});

export const rejectFollowRequest = asyncHandler(async (req: Request, res: Response) => {
    const myId = req.user.id;
    const followId = parseInt((req.params as any).id);

    const request = await prisma.follow.findUnique({ where: { id: followId } });
    if (!request || request.followingId !== myId) {
        return res.status(404).render('404', { message: 'Follow request not found' });
    }

    await prisma.follow.delete({ where: { id: followId } });

    res.redirect('/users/requests');
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
    const relation = user.followers[0];
    const isFollowing = relation?.status === 'ACCEPTED';
    const isPending = relation?.status === 'PENDING';

    res.render('users/show', { profileUser: user, isMe, isFollowing, isPending });
});

//edit profile page
// GET user profile edit page
export const getEditProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return res.redirect('/auth/login');
    res.render('users/edit', {
        user: req.user,
        error: {},
        success: req.query.success,
    });
});

//edit the page
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return res.redirect('/auth/login');

    //validation using Zod
    const result = updateProfileSchema.safeParse(req.body);

    //check if success
    if (!result.success) {
        const formattedError = result.error.flatten().fieldErrors;
        return res.status(400).render('users/edit', {
            user: req.user,
            error: formattedError,
            success: false,
        });
    }
    const myId = req.user.id;
    const { username, avatarUrl, isPrivate } = result.data;

    //CHECK UNIQUENESS if username changed
    if (username !== req.user.username) {
        const existing = await prisma.user.findUnique({
            where: { username: username },
        });
        if (existing) {
            return res.status(400).render('users/edit', {
                user: { ...req.user, ...req.body },
                error: { username: ['Username already existed'] },
                success: false,
            });
        }
    }

    let avatarUrlToSave = avatarUrl || undefined;

    if (req.file) {
        const ext =
            req.file.originalname.split('.').pop()?.toLowerCase() ||
            req.file.mimetype.split('/')[1] ||
            'png';
        const filePath = `avatars/${req.user.id}-${Date.now()}.${ext}`;

        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true,
            });

        if (error) {
            return res.status(500).render('users/edit', {
                user: { ...req.user, ...req.body },
                error: { avatarUrl: [error.message] },
                success: false,
            });
        }

        const { data: publicUrl } = supabase.storage.from('uploads').getPublicUrl(data.path);
        avatarUrlToSave = publicUrl.publicUrl;
    }

    //change the data
    await prisma.user.update({
        where: { id: myId },
        data: {
            username,
            avatarUrl: avatarUrlToSave,
            isPrivate,
        },
    });
    res.redirect('/users/settings?success=true');
});
