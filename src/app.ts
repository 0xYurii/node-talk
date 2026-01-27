import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error';
import authRoute from './routes/auth';
import sessionMiddleware from './config/session';
import passport from './config/passport';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (adjust origin to your frontend)
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    }),
);

// Sessions + Passport
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
});

app.use('/auth', authRoute);

// Error handler (last)
app.use(errorHandler);

// Start
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
