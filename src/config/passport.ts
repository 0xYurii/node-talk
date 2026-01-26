import passport from "passport";
import bcrypt from "bcryptjs";
import { Strategy as LocalStrategy } from "passport-local";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

passport.use(
    new LocalStrategy(
        { usernameField: "email" }, // or "username"
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
                        message: "Invalid credentials",
                    });

                const ok = await bcrypt.compare(password, user.password);
                if (!ok)
                    return done(null, false, {
                        message: "Invalid credentials",
                    });

                return done(null, user);
            } catch (err) {
                return done(err);
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
        const userId = await prisma.user.findUnique({
            where: { id: id },
        });
        done(null, userId);
    } catch (error) {
        done(error);
    }
});

export default passport;
