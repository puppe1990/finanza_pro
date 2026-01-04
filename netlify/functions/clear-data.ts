import { ensureSchema, jsonResponse, sql } from './_db';

export const handler = async (event: { httpMethod?: string }) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    await ensureSchema();
    await sql`DELETE FROM uploads;`;
    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error('clear-data error', error);
    return jsonResponse(500, { error: 'Failed to clear data.' });
  }
};
