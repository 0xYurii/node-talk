import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error';
import authRoute from './routes/auth';
import sessionMiddleware from './config/session';
import passport from './config/passport';
import path from 'path';
import postRoute from './routes/posts';
import userRoute from './routes/users';
import chatRoute from './routes/chat';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
});
// Make 'io' accessible in Controllers via req.app.get('io')
app.set('io', io);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
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
app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    next();
});

// VIEW ENGINE SETUP
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//serve Static files
app.use(express.static(path.join(__dirname, '../public')));

io.on('connection', (socket) => {
    console.log('⚡ User connected:', socket.id);
    //join a room based on userId for now
    const userId = socket.handshake.query.userId;
    if (userId) {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room user_${userId}`);
    }
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Routes
app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
});
//server home page
app.get('/', (req, res) => {
    if (req.user) return res.redirect('/posts');
    res.render('index');
});

app.use('/auth', authRoute);

app.use('/posts', postRoute);

app.use('/users', userRoute);

app.use('/chat', chatRoute);

// Error handler (last)
app.use(errorHandler);

// Start the server only when this file is executed directly.
if (require.main === module) {
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app; //Export app for tests
