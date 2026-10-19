const { Pool } = require('pg');
const { databaseUrl, isProduction } = require('./config');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isProduction && process.env.DATABASE_SSL !== 'false'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30_000,
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drc_profiles (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      min_trace_width DOUBLE PRECISION NOT NULL CHECK (min_trace_width > 0),
      min_clearance DOUBLE PRECISION NOT NULL CHECK (min_clearance > 0),
      min_annular_ring DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (min_annular_ring >= 0),
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO drc_profiles (id, name, description, min_trace_width, min_clearance, min_annular_ring, is_default)
    VALUES ('00000000-0000-4000-8000-000000000001', 'Standard fabrication', 'General-purpose fabrication limits for a standard two-layer PCB.', 0.20, 0.20, 0.15, TRUE)
    ON CONFLICT (id) DO NOTHING
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drc_jobs (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename VARCHAR(255) NOT NULL,
      profile_id UUID NOT NULL REFERENCES drc_profiles(id),
      profile_name VARCHAR(100) NOT NULL,
      status VARCHAR(10) NOT NULL CHECK (status IN ('PASS', 'FAIL', 'ERROR')),
      total_errors INTEGER NOT NULL DEFAULT 0 CHECK (total_errors >= 0),
      errors JSONB NOT NULL DEFAULT '[]'::jsonb,
      warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS drc_jobs_user_created_idx ON drc_jobs (user_id, created_at DESC)`);
}

module.exports = { pool, initializeDatabase };
