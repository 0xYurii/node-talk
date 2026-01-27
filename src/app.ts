import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error';
import authRoute from './routes/auth';
import sessionMiddleware from './config/session';
import passport from './config/passport';
import path from 'path';

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

// VIEW ENGINE SETUP
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//serve Static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
});
//server home page
app.get('/', (req, res) => {
    res.render('index');
});

app.use('/auth', authRoute);

// Error handler (last)
app.use(errorHandler);

// Start the server only when this file is executed directly.
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
