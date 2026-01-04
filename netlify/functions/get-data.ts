import { ensureSchema, jsonResponse, sql } from './_db';

export const handler = async () => {
  try {
    await ensureSchema();

    const uploads = await sql`
      SELECT
        id,
        filename,
        timestamp,
        transaction_count AS "transactionCount"
      FROM uploads
      ORDER BY created_at DESC;
    `;

    const transactions = await sql`
      SELECT
        id,
        date,
        type,
        description,
        amount::float AS amount,
        category
      FROM transactions
      ORDER BY created_at ASC;
    `;

    return jsonResponse(200, { uploads, transactions });
  } catch (error) {
    console.error('get-data error', error);
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse(500, { error: 'Failed to load data.', detail: message });
  }
};
