import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    const wantsHtml = req.headers.accept?.includes('text/html');
    if (wantsHtml) {
        return res.redirect('/auth/login');
    }
    return res.status(401).json({ error: 'Unauthorized' });
};
