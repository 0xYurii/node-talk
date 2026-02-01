import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_BODY_FIELD = 'csrfToken';

const isUnsafeMethod = (method: string) =>
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

const parseCookies = (cookieHeader?: string) => {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;
    const parts = cookieHeader.split(';');
    for (const part of parts) {
        const [rawName, ...rest] = part.trim().split('=');
        if (!rawName) continue;
        const rawValue = rest.join('=');
        cookies[rawName] = decodeURIComponent(rawValue || '');
    }
    return cookies;
};

const safeEqual = (a: string, b: string) => {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
};

const ensureCsrfCookie = (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    let token = cookies[CSRF_COOKIE_NAME];
    if (!token) {
        token = crypto.randomBytes(32).toString('hex');
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
    }
    res.locals.csrfToken = token;
    return token;
};

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    const cookieToken = ensureCsrfCookie(req, res);

    if (!isUnsafeMethod(req.method)) {
        return next();
    }

    const bodyToken = req.body?.[CSRF_BODY_FIELD];
    const headerToken =
        (req.headers['x-csrf-token'] as string | undefined) ||
        (req.headers['x-xsrf-token'] as string | undefined);

    const requestToken = bodyToken || headerToken;

    if (!requestToken || !safeEqual(String(requestToken), String(cookieToken))) {
        return res.status(403).send('Invalid CSRF token.');
    }

    return next();
};
