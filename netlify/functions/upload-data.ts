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

    const normalized = transactions.map((transaction: Record<string, unknown>) => {
      const rawId = transaction?.id ? String(transaction.id).trim() : '';
      const sourceId = rawId || null;
      const transactionId = sourceId ? `${uploadId}-${sourceId}` : randomUUID();
      const amount = Number(transaction?.amount);

      return {
        id: transactionId,
        uploadId,
        sourceId,
        date: typeof transaction?.date === 'string' ? transaction.date : '',
        type: typeof transaction?.type === 'string' ? transaction.type : '',
        description: typeof transaction?.description === 'string' ? transaction.description : '',
        amount: Number.isFinite(amount) ? amount : 0,
        category: typeof transaction?.category === 'string' ? transaction.category : '',
      };
    });

    const seenSourceIds = new Set<string>();
    const uniqueNormalized = normalized.filter((item) => {
      if (!item.sourceId) return true;
      if (seenSourceIds.has(item.sourceId)) return false;
      seenSourceIds.add(item.sourceId);
      return true;
    });

    const sourceIds = uniqueNormalized
      .map((item) => item.sourceId)
      .filter((id): id is string => Boolean(id));

    const existingRows = sourceIds.length
      ? await sql`SELECT source_id FROM transactions WHERE source_id = ANY(${sourceIds})`
      : [];
    const existingSourceIds = new Set(existingRows.map((row) => row.source_id as string));

    const insertable = uniqueNormalized.filter(
      (item) => !item.sourceId || !existingSourceIds.has(item.sourceId)
    );

    await sql`
      INSERT INTO uploads (id, filename, timestamp, transaction_count)
      VALUES (${uploadId}, ${filename}, ${timestamp}, ${insertable.length})
      ON CONFLICT (id) DO NOTHING;
    `;

    if (insertable.length > 0) {
      const batchSize = 200;
      for (let i = 0; i < insertable.length; i += batchSize) {
        const batch = insertable.slice(i, i + batchSize);
        // Fazer inserts em batch usando Promise.all para paralelismo
        await Promise.all(
          batch.map((item) =>
            sql`
              INSERT INTO transactions (
                id,
                upload_id,
                source_id,
                date,
                type,
                description,
                amount,
                category
              )
              VALUES (
                ${item.id},
                ${item.uploadId},
                ${item.sourceId},
                ${item.date},
                ${item.type},
                ${item.description},
                ${item.amount},
                ${item.category}
              )
              ON CONFLICT (id) DO NOTHING
            `
          )
        );
      }
    }

    const receivedCount = transactions.length;
    const insertedCount = insertable.length;
    const skippedDuplicates = Math.max(0, receivedCount - insertedCount);

    return jsonResponse(200, {
      upload: {
        id: uploadId,
        filename,
        timestamp,
        transactionCount: insertedCount,
      },
      receivedCount,
      insertedCount,
      skippedDuplicates,
    });
  } catch (error) {
    console.error('upload-data error', error);
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse(500, { error: 'Failed to save data.', detail: message });
  }
};
