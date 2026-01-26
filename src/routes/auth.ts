import { Router } from "express";
import passport from "passport";
import { Request, Response, NextFunction } from "express";
import {
    signup,
    getCurrentUser,
    loginAsGuest,
} from "../controllers/authController";
import { requireAuth } from "../middleware/requireAuth";

const authRoute = Router();

authRoute.post(
    "/login",
    passport.authenticate("local"),
    (req: Request, res: Response) => {
        if (!req.user) return res.status(401).json({ error: "Login failed" });

        const { password, ...safeUser } = req.user as any;
        res.status(201).json({
            message: "Logged in!",
            user: safeUser,
        });
    },
);

authRoute.post("/signup", signup);

//log out route
authRoute.post("/logout", (req: Request, res: Response) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.json({ message: "Logged out!" });
    });
});

//guest login
authRoute.post("/guest", loginAsGuest);

//get current user route
authRoute.get("/me", requireAuth, getCurrentUser);

export default authRoute;
