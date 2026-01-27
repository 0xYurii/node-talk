const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: '.env.test' });
process.env.NODE_ENV = 'test';

execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
});

const sessionSqlPath = path.join(__dirname, '..', 'node_modules', 'connect-pg-simple', 'table.sql');
const sessionSql = fs.readFileSync(sessionSqlPath, 'utf8');

async function ensureSessionTable() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        await client.query(sessionSql);
    } catch (err) {
        if (err && err.code === '42P07') {
            // Table already exists.
        } else {
            throw err;
        }
    }
    await client.end();
}

ensureSessionTable().catch((err) => {
    console.error('Failed to ensure session table:', err);
    process.exit(1);
});
