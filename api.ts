import { Transaction, UploadRecord } from './types';

const FUNCTIONS_BASE = '/.netlify/functions';

const handleJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.error ||
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data as T;
};

export const fetchData = async () => {
  const response = await fetch(`${FUNCTIONS_BASE}/get-data`);
  return handleJson<{ transactions: Transaction[]; uploads: UploadRecord[] }>(response);
};

export const uploadData = async (payload: {
  uploadId: string;
  filename: string;
  timestamp: string;
  transactions: Transaction[];
}) => {
  const response = await fetch(`${FUNCTIONS_BASE}/upload-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson<{
    upload: UploadRecord;
    receivedCount: number;
    insertedCount: number;
    skippedDuplicates: number;
  }>(response);
};

export const clearData = async () => {
  const response = await fetch(`${FUNCTIONS_BASE}/clear-data`, {
    method: 'POST',
  });
  return handleJson<{ ok: boolean }>(response);
};
