import client from './client';

export interface UploadResult {
  total_rows: number;
  flagged_count: number;
  new_alerts_count: number;
  transaction_ids: string[];
}

export const uploadCsv = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return client
    .post('/upload/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data as { data: UploadResult });
};

export interface TransactionRow {
  timestamp: string;
  from_bank: string;
  from_account: string;
  to_bank: string;
  to_account: string;
  amount_received: number;
  receiving_currency: string;
  amount_paid: number;
  payment_currency: string;
  payment_format: string;
}

export const uploadRows = (rows: TransactionRow[]) =>
  client.post('/upload/rows', { rows }).then((r) => r.data as { data: UploadResult });
