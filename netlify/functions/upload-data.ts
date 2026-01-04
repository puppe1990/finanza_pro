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

    const normalized = transactions.map((transaction: Record<string, unknown>) => {
      const rawId = transaction?.id ? String(transaction.id) : null;
      const transactionId = rawId ? `${uploadId}-${rawId}` : randomUUID();
      const amount = Number(transaction?.amount);

      return {
        id: transactionId,
        uploadId,
        date: typeof transaction?.date === 'string' ? transaction.date : '',
        type: typeof transaction?.type === 'string' ? transaction.type : '',
        description: typeof transaction?.description === 'string' ? transaction.description : '',
        amount: Number.isFinite(amount) ? amount : 0,
        category: typeof transaction?.category === 'string' ? transaction.category : '',
      };
    });

    if (normalized.length > 0) {
      const batchSize = 200;
      for (let i = 0; i < normalized.length; i += batchSize) {
        const batch = normalized.slice(i, i + batchSize);
        // Fazer inserts em batch usando Promise.all para paralelismo
        await Promise.all(
          batch.map((item) =>
            sql`
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
                ${item.id},
                ${item.uploadId},
                ${item.date},
                ${item.type},
                ${item.description},
                ${item.amount},
                ${item.category}
              )
            `
          )
        );
      }
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
