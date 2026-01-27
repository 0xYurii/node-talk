import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';
import resetDb from './helpers/reset-db';
import { seedUser } from './helpers/seed-users';

describe('Auth System', () => {
    // 1. CLEAN SLATE PROTOCOL
    beforeEach(async () => {
        await resetDb();
    });

    // 2. TEARDOWN
    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /auth/signup', () => {
        it('should create a new user and log them in', async () => {
            const res = await request(app).post('/auth/signup').send({
                username: 'testdev',
                email: 'test@archlinux.org',
                password: 'password123',
            });

            expect(res.status).toBe(201);
            expect(res.body.user).toHaveProperty('id');
            expect(res.body.user.email).toBe('test@archlinux.org');
            // SECURITY CHECK: Ensure password is NOT returned
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('should reject duplicate emails', async () => {
            await seedUser({
                username: 'user1',
                email: 'dupe@test.com',
                password: 'secret123',
            });

            // Try to create user 2 with same email
            const res = await request(app).post('/auth/signup').send({
                username: 'user2',
                email: 'dupe@test.com',
                password: 'password123',
            });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/exists/i);
        });

        it('should reject duplicate usernames', async () => {
            await seedUser({
                username: 'sameuser',
                email: 'one@test.com',
                password: 'secret123',
            });

            const res = await request(app).post('/auth/signup').send({
                username: 'sameuser',
                email: 'two@test.com',
                password: 'password123',
            });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/exists/i);
        });

        it('should reject missing fields', async () => {
            const res = await request(app).post('/auth/signup').send({
                username: 'missing-email',
                password: 'password123',
            });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/missing fields/i);
        });
    });

    describe('POST /auth/login', () => {
        it('should login an existing user', async () => {
            await seedUser({
                username: 'loginUser',
                email: 'login@test.com',
                password: 'secret123',
            });

            const res = await request(app).post('/auth/login').send({
                email: 'login@test.com',
                password: 'secret123',
            });

            expect(res.status).toBe(201); //
            expect(res.body.message).toMatch(/logged in/i);
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('should reject wrong passwords', async () => {
            await seedUser({
                username: 'hackme',
                email: 'hack@test.com',
                password: 'secret123',
            });

            const res = await request(app).post('/auth/login').send({
                email: 'hack@test.com',
                password: 'wrongpassword',
            });

            expect(res.status).toBe(401);
        });

        it('should reject unknown emails', async () => {
            const res = await request(app).post('/auth/login').send({
                email: 'missing@test.com',
                password: 'secret123',
            });

            expect(res.status).toBe(401);
        });
    });

    describe('POST /auth/guest', () => {
        it('should login as guest if guest exists', async () => {
            await seedUser({
                email: 'guest@nodetalk.com',
                username: 'GuestUser',
                password: 'guestpassword123',
            });

            const res = await request(app).post('/auth/guest');

            expect(res.status).toBe(200);
            expect(res.body.user.username).toBe('GuestUser');
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('should fail if guest is not in DB', async () => {
            // DB is empty here because of beforeEach(resetDb)
            const res = await request(app).post('/auth/guest');

            expect(res.status).toBe(500);
        });
    });

    describe('POST /auth/logout', () => {
        it('should logout an authenticated user', async () => {
            await seedUser({
                username: 'logoutUser',
                email: 'logout@test.com',
                password: 'secret123',
            });

            const agent = request.agent(app);

            const loginRes = await agent.post('/auth/login').send({
                email: 'logout@test.com',
                password: 'secret123',
            });

            expect(loginRes.status).toBe(201);

            const res = await agent.post('/auth/logout');

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/logged out/i);
        });
    });

    describe('GET /auth/me', () => {
        it('should return 401 when not authenticated', async () => {
            const res = await request(app).get('/auth/me');

            expect(res.status).toBe(401);
        });

        it('should return current user when authenticated', async () => {
            await seedUser({
                username: 'meUser',
                email: 'me@test.com',
                password: 'secret123',
            });

            const agent = request.agent(app);

            const loginRes = await agent.post('/auth/login').send({
                email: 'me@test.com',
                password: 'secret123',
            });

            expect(loginRes.status).toBe(201);

            const res = await agent.get('/auth/me');

            expect(res.status).toBe(201);
            expect(res.body.user.email).toBe('me@test.com');
            expect(res.body.user).not.toHaveProperty('password');
        });
    });
    describe('GET /auth/github', () => {
        it('should redirect to GitHub', async () => {
            const res = await request(app).get('/auth/github');
            // 302 means "Found"
            expect(res.status).toBe(302);
            expect(res.header.location).toMatch(/github.com/);
        });
    });
});
