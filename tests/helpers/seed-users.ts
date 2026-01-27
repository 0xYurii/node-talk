import bcrypt from 'bcryptjs';
import prisma from '../../src/config/prisma';

type SeedUserInput = {
    email: string;
    username: string;
    password: string;
    isPrivate?: boolean;
};

export async function seedUser(input: SeedUserInput) {
    const hashedPassword = await bcrypt.hash(input.password, 10);

    return prisma.user.create({
        data: {
            email: input.email,
            username: input.username,
            password: hashedPassword,
            isPrivate: input.isPrivate ?? false,
        },
    });
}

export async function seedUsers(inputs: SeedUserInput[]) {
    const created = [];
    for (const input of inputs) {
        created.push(await seedUser(input));
    }
    return created;
}
