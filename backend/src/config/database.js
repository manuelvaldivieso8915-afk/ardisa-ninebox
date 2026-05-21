const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.eadxiymxtznosuayjljc',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false, servername: 'aws-0-us-west-2.pooler.supabase.com' },
  max: 5,
});

pool.on('connect', () => console.log('✅ PostgreSQL connected'));
pool.on('error', (err) => console.error('❌ PostgreSQL error:', err));

module.exports = pool;
