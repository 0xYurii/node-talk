import 'dotenv/config';
import session from 'express-session';
import connectPgsimple from 'connect-pg-simple';
import pg from 'pg';

const PgStore = connectPgsimple(session);

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const sessionMiddleware = session({
    store: new PgStore({
        pool,
        tableName: 'session',
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, //process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: 'lax',
    },
});

export default sessionMiddleware;
