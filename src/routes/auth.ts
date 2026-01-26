import { Router } from "express";
import passport from "passport";
import { Request, Response, NextFunction } from "express";
import { signup, getCurrentUser } from "../controllers/authController";
import { requireAuth } from "../middleware/requireAuth";
import { get } from "https";

const authRoute = Router();

authRoute.post(
    "/login",
    passport.authenticate("local"),
    (req: Request, res: Response) => {
        res.status(201).json({
            message: "Logged in!",
            user: req.user,
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

//get current user route
authRoute.get("/me", requireAuth, getCurrentUser);

export default authRoute;
