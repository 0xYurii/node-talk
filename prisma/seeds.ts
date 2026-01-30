import { PrismaPg } from '@prisma/adapter-pg';
import { FollowStatus, PrismaClient } from '../generated/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting seed...');

    // 1. CLEANUP:
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Database cleaned.');

    // 2. CONFIG
    const TOTAL_USERS = 50;
    const POSTS_PER_USER = 5;

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 3. CREATE USERS
    const users = [];

    // Create the Guest User specifically
    const guestUser = await prisma.user.upsert({
        where: { email: 'guest@nodetalk.com' },
        update: {},
        create: {
            email: 'guest@nodetalk.com',
            username: 'GuestUser',
            password: await bcrypt.hash('guestpassword123', 10),
            avatarUrl:
                'https://zqsqxpnhcgkngfjrldkn.supabase.co/storage/v1/object/public/avatars/photo_2025-08-07_09-45-39.jpg',
            isPrivate: false,
        },
    });
    console.log('👻 Guest user ready.');

    for (let i = 0; i < TOTAL_USERS; i++) {
        // Generate a new user
        const user = await prisma.user.create({
            data: {
                username: faker.internet.username() + i, // Append i to ensure uniqueness
                email: faker.internet.email(),
                password: hashedPassword,
                avatarUrl: faker.image.avatar(),
                isPrivate: faker.datatype.boolean(),
                // Create posts immediately for this user
                posts: {
                    create: Array.from({ length: POSTS_PER_USER }).map(() => ({
                        title: faker.lorem.sentence(), // Since your schema requires title
                        content: faker.lorem.paragraph(),
                    })),
                },
            },
        });
        users.push(user);
    }

    console.log(`👤 Created ${users.length} users with posts.`);

    // 4. CREATE INTERACTIONS (Likes, Comments, Follows)
    // Now that users exist, we can link them up.

    const allPosts = await prisma.post.findMany();

    for (const post of allPosts) {
        // Randomly select a few users to like this post
        const randomUsers = faker.helpers.arrayElements(
            users,
            faker.number.int({ min: 0, max: 5 }),
        );

        for (const liker of randomUsers) {
            // Don't let users like their own post (optional logic, but realistic)
            if (liker.id !== post.authorId) {
                await prisma.like.create({
                    data: {
                        userId: liker.id,
                        postId: post.id,
                    },
                });
            }
        }

        // Add a comment
        if (Math.random() > 0.5) {
            // 50% chance of a comment
            const commenter = users[Math.floor(Math.random() * users.length)];
            await prisma.comment.create({
                data: {
                    content: faker.lorem.sentence(),
                    userId: commenter.id,
                    postId: post.id,
                },
            });
        }
    }

    // 5. CREATE FOLLOWS
    for (const user of users) {
        const potentialFollows = users.filter((u) => u.id !== user.id);
        const following = faker.helpers.arrayElements(
            potentialFollows,
            faker.number.int({ min: 1, max: 5 }),
        );

        for (const target of following) {
            await prisma.follow.create({
                data: {
                    followerId: user.id,
                    followingId: target.id,
                    status: FollowStatus.ACCEPTED, // Assume accepted for now
                },
            });
        }
    }

    // 6. CREATE CONVERSATIONS + MESSAGES
    const allUsers = [guestUser, ...users];
    const conversationPairs = new Set<string>();
    const TOTAL_CONVERSATIONS = 10;

    for (let i = 0; i < TOTAL_CONVERSATIONS; i++) {
        const [userA, userB] = faker.helpers.arrayElements(allUsers, 2);
        const pairKey = userA.id < userB.id ? `${userA.id}-${userB.id}` : `${userB.id}-${userA.id}`;

        if (conversationPairs.has(pairKey)) {
            i--;
            continue;
        }

        conversationPairs.add(pairKey);

        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    connect: [{ id: userA.id }, { id: userB.id }],
                },
            },
        });

        const messageCount = faker.number.int({ min: 3, max: 12 });
        for (let m = 0; m < messageCount; m++) {
            const sender = m % 2 === 0 ? userA : userB;
            await prisma.message.create({
                data: {
                    content: faker.lorem.sentences({ min: 1, max: 3 }),
                    senderId: sender.id,
                    conversationId: conversation.id,
                    isRead: faker.datatype.boolean(),
                },
            });
        }
    }

    console.log('🌱 Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
