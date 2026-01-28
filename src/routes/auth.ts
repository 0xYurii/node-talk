import { Router } from 'express';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { signup, getCurrentUser, loginAsGuest } from '../controllers/authController';
import { requireAuth } from '../middleware/requireAuth';

const authRoute = Router();

authRoute.get('/login', (req: Request, res: Response) => {
    res.render('auth/login', { error: req.query.error });
});

authRoute.post('/login', (req: Request, res: Response, next: NextFunction) => {
    const wantsHtml = req.headers.accept?.includes('text/html');
    passport.authenticate('local', (err: any, user: any) => {
        if (err) return next(err);
        if (!user) {
            if (wantsHtml) return res.redirect('/auth/login?error=1');
            return res.status(401).json({ error: 'Login failed' });
        }
        req.login(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            const { password, ...safeUser } = user as any;
            if (wantsHtml) {
                if (req.session) {
                    return req.session.save(() => res.redirect('/posts'));
                }
                return res.redirect('/posts');
            }
            return res.status(201).json({ message: 'Logged in!', user: safeUser });
        });
    })(req, res, next);
});

authRoute.post('/signup', signup);

authRoute.get('/signup', (req: Request, res: Response) => {
    res.render('auth/signup', { error: req.query.error });
});

// guest login (view + action)
authRoute.get('/guest', (req: Request, res: Response) => {
    res.render('auth/guest', { error: req.query.error });
});

//log out route
authRoute.post('/logout', (req: Request, res: Response) => {
    const wantsHtml = req.headers.accept?.includes('text/html');
    req.logout((err) => {
        if (err) {
            if (wantsHtml) return res.redirect('/?error=logout');
            return res.status(500).json({ error: 'Logout failed' });
        }
        if (wantsHtml) return res.redirect('/');
        return res.json({ message: 'Logged out!' });
    });
});

authRoute.get('/logout', (_req: Request, res: Response) => {
    res.render('auth/logout');
});

//github login (view + action + compatibility)
authRoute.get('/github', (req: Request, res: Response, next: NextFunction) => {
    const wantsHtml = req.headers.accept?.includes('text/html');
    if (wantsHtml) return res.render('auth/github');
    return passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
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

//get current user route (api + view)
authRoute.get('/me', requireAuth, getCurrentUser);
authRoute.get('/me/view', requireAuth, (req: Request, res: Response) => {
    res.render('auth/me', { user: req.user });
});
authRoute.get('/me/json', requireAuth, getCurrentUser);

export default authRoute;
