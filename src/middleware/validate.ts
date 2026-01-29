import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export const validate =
    (schema: ZodObject, source: 'body' | 'query' | 'params') =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse(req[source]);

            //replace data with the clean parsed data
            req[source] = parsed;
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const wantsHtml = req.headers.accept?.includes('text/html');
                if (wantsHtml) {
                    return res.status(400).send(err.flatten().fieldErrors);
                }

                return res.status(400).json({
                    status: 'fail',
                    error: err.flatten().fieldErrors,
                });
            }
            next(err);
        }
    };
