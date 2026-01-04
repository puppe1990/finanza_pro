import { neon } from '@netlify/neon';

const sql = neon();

export const ensureSchema = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      transaction_count INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      upload_id TEXT REFERENCES uploads(id) ON DELETE CASCADE,
      date TEXT,
      type TEXT,
      description TEXT,
      amount NUMERIC,
      category TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS transactions_upload_id_idx
    ON transactions(upload_id);
  `;
};

export const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

export { sql };
