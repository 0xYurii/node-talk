import prisma from '../../src/config/prisma';

export default async function resetDb() {
    // Delete in order of constraints
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
}
