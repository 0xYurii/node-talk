import { Router } from 'express';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { signup, getCurrentUser, loginAsGuest } from '../controllers/authController';
import { requireAuth } from '../middleware/requireAuth';

const authRoute = Router();

authRoute.get('/login', (_req: Request, res: Response) => {
    res.render('auth/login');
});

authRoute.post('/login', passport.authenticate('local'), (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Login failed' });

    const { password, ...safeUser } = req.user as any;
    res.status(201).json({
        message: 'Logged in!',
        user: safeUser,
    });
});

authRoute.post('/signup', signup);

authRoute.get('/signup', (_req: Request, res: Response) => {
    res.render('auth/signup');
});

// guest login (view + action)
authRoute.get('/guest', (_req: Request, res: Response) => {
    res.render('auth/guest');
});

//log out route
authRoute.post('/logout', (req: Request, res: Response) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ message: 'Logged out!' });
    });
});

authRoute.get('/logout', (_req: Request, res: Response) => {
    res.render('auth/logout');
});

//github login (view + action)
authRoute.get('/github', (_req: Request, res: Response) => {
    res.render('auth/github');
});
authRoute.get('/github/start', passport.authenticate('github', { scope: ['user:email'] }));
authRoute.get(
    '/github/callback',
    passport.authenticate('github', { failureRedirect: '/auth/login' }),
    (req: Request, res: Response) => {
        // Successful authentication, redirect home.
        res.redirect('/');
    },
);
//guest login
authRoute.post('/guest', loginAsGuest);

//get current user route (view + api)
authRoute.get('/me', requireAuth, (req: Request, res: Response) => {
    res.render('auth/me', { user: req.user });
});
authRoute.get('/me/json', requireAuth, getCurrentUser);

export default authRoute;
