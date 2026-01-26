import { Router } from "express";
import passport from "passport";
import { Request, Response, NextFunction } from "express";

const authRoute = Router();

authRoute.post(
    "/login",
    passport.authenticate("local"),
    (req: Request, res: Response) => {
        res.status(201).json({
            message: "Logged in",
            user: req.user,
        });
    },
);


authRoute.post()

export default authRoute;
