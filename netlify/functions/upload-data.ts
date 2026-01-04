import { randomUUID } from 'node:crypto';
import { ensureSchema, jsonResponse, sql } from './_db';

export const handler = async (event: { httpMethod?: string; body?: string }) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    await ensureSchema();

    const payload = event.body ? JSON.parse(event.body) : null;
    if (!payload) {
      return jsonResponse(400, { error: 'Missing payload.' });
    }

    const uploadId = payload.uploadId || randomUUID();
    const filename = typeof payload.filename === 'string' ? payload.filename : 'arquivo.csv';
    const timestamp = typeof payload.timestamp === 'string' ? payload.timestamp : new Date().toISOString();
    const transactions = Array.isArray(payload.transactions) ? payload.transactions : [];

    await sql`
      INSERT INTO uploads (id, filename, timestamp, transaction_count)
      VALUES (${uploadId}, ${filename}, ${timestamp}, ${transactions.length});
    `;

    for (const transaction of transactions) {
      const rawId = transaction?.id ? String(transaction.id) : null;
      const transactionId = rawId ? `${uploadId}-${rawId}` : randomUUID();
      await sql`
        INSERT INTO transactions (
          id,
          upload_id,
          date,
          type,
          description,
          amount,
          category
        )
        VALUES (
          ${transactionId},
          ${uploadId},
          ${transaction.date},
          ${transaction.type},
          ${transaction.description},
          ${transaction.amount},
          ${transaction.category}
        );
      `;
    }

    return jsonResponse(200, {
      upload: {
        id: uploadId,
        filename,
        timestamp,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error('upload-data error', error);
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse(500, { error: 'Failed to save data.', detail: message });
  }
};
