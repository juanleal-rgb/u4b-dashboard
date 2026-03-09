import { Pool } from 'pg';

// Singleton pool for PostgreSQL connection
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('railway')
        ? { rejectUnauthorized: false }
        : false,
    });
  }
  return pool;
}

// Initialize database schema on first run
export async function initDb(): Promise<void> {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS calls (
      id          SERIAL PRIMARY KEY,
      phone       VARCHAR(50)  NOT NULL,
      name        VARCHAR(255),
      company     VARCHAR(255),
      status      VARCHAR(100) NOT NULL,
      qualified   BOOLEAN      DEFAULT FALSE,
      meeting     TIMESTAMPTZ,
      summary     TEXT         DEFAULT '',
      attempt     INTEGER      DEFAULT 1,
      duration    INTEGER      DEFAULT 0,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_calls_phone ON calls(phone);
    CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
  `);
}
