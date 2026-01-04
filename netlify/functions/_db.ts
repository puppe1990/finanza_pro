import { neon } from '@netlify/neon';

type SqlTag = ReturnType<typeof neon>;

let sqlClient: SqlTag | null = null;

const getSqlClient = () => {
  if (sqlClient) return sqlClient;
  const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Missing NETLIFY_DATABASE_URL environment variable.');
  }
  sqlClient = neon(url);
  return sqlClient;
};

const sql: SqlTag = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  getSqlClient()(strings, ...values)) as SqlTag;

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
