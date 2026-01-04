import { Transaction, UploadRecord } from './types';

const FUNCTIONS_BASE = '/.netlify/functions';

const handleJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
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
  return handleJson<{ upload: UploadRecord }>(response);
};

export const clearData = async () => {
  const response = await fetch(`${FUNCTIONS_BASE}/clear-data`, {
    method: 'POST',
  });
  return handleJson<{ ok: boolean }>(response);
};
