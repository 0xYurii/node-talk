import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const signup = asyncHandler(async (req: Request, res: Response) => {
    const email = String(req.body.email || "")
        .trim()
        .toLowerCase();
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const isPrivate =
        typeof req.body.isPrivate === "boolean" ? req.body.isPrivate : false;

    if (!email || !username || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const [emailExists, usernameExists] = await Promise.all([
        prisma.user.findUnique({ where: { email } }),
        prisma.user.findUnique({ where: { username } }),
    ]);

    if (emailExists || usernameExists) {
        return res.status(400).json({ error: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { username, email, password: hash, isPrivate },
        select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            isPrivate: true,
        },
    });

    req.login(user, (err) => {
        if (err) {
            return res.status(500).json({ error: "Login failed" });
        }
        return res
            .status(201)
            .json({ message: "User created and logged in!", user });
    });
});

export const getCurrentUser = asyncHandler(
    async (req: Request, res: Response) => {
        return res.status(201).json({
            message: "About me",
            user: req.user,
        });
    },
);

export const loginAsGuest = asyncHandler(
    async (req: Request, res: Response) => {
        const guest = await prisma.user.findUnique({
            where: { email: "guest@nodetalk.com" },
        });
        if (!guest) {
            return res
                .status(500)
                .json({ error: "Guest account not configured" });
        }
        req.login(guest, (err) => {
            if (err) {
                return res.status(500).json({ error: "Login failed" });
            }

            //remove password before sending back
            const { password, ...userwithoutPassword } = guest;
            return res.status(200).json({
                message: "Welcome, Guest!",
                user: userwithoutPassword,
            });
        });
    },
);
