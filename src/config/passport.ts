import passport from 'passport';
import bcrypt from 'bcryptjs';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

passport.use(
    new LocalStrategy(
        { usernameField: 'email' }, // or "username"
        async (
            email: string,
            password: string,
            done: (err: any, user?: any, info?: { message: string }) => void,
        ) => {
            try {
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user)
                    return done(null, false, {
                        message: 'Invalid credentials',
                    });

                const ok = await bcrypt.compare(password, user.password);
                if (!ok)
                    return done(null, false, {
                        message: 'Invalid credentials',
                    });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        },
    ),
);

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            callbackURL: 'http://localhost:3000/auth/github/callback',
            scope: ['user:email'], // <--- CRITICAL: Request email permission
        },
        async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
            try {
                // 1. Check if user already exists with this GitHub ID
                const existingUser = await prisma.user.findUnique({
                    where: { githubId: profile.id },
                });

                if (existingUser) {
                    return done(null, existingUser);
                }

                // 2. If not, check if user exists by Email (Account Linking)
                // GitHub profiles have an 'emails' array. content depends on user privacy settings.
                const email = profile.emails?.[0]?.value;

                if (email) {
                    const existingEmailUser = await prisma.user.findUnique({
                        where: { email: email },
                    });

                    if (existingEmailUser) {
                        // LINK ACCOUNTS: Update the user to include the githubId
                        const updatedUser = await prisma.user.update({
                            where: { id: existingEmailUser.id },
                            data: { githubId: profile.id },
                        });
                        return done(null, updatedUser);
                    }
                }

                // 3. Create new user
                // We need a password because your schema requires it.
                // Generate a random high-entropy password.
                const randomPassword = crypto.randomBytes(32).toString('hex');
                const hashedPassword = await bcrypt.hash(randomPassword, 10);

                //hande duplicate usernames
                const baseUsername = profile.username || `gh-${profile.id}`;

                async function getUniqueUsername(base: string) {
                    let username = base;
                    for (let i = 0; i < 5; i++) {
                        const exists = await prisma.user.findUnique({ where: { username } });
                        if (!exists) return username;
                        username = `${base}-${Math.floor(Math.random() * 9999)}`;
                    }
                    return `${base}-${crypto.randomBytes(2).toString('hex')}`;
                }

                const username = await getUniqueUsername(baseUsername);

                const newUser = await prisma.user.create({
                    data: {
                        username,
                        email: email || `no-email-${profile.id}@github.com`,
                        password: hashedPassword,
                        githubId: profile.id,
                        avatarUrl: profile.photos?.[0]?.value || '',
                        isPrivate: false,
                    },
                });

                return done(null, newUser);
            } catch (err) {
                return done(err, false);
            }
        },
    ),
);

// store only the id of user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isPrivate: true,
            },
        });
        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;
