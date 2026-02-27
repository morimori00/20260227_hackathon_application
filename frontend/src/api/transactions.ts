import client from './client';

export interface TransactionFilters {
  page?: number;
  per_page?: number;
  from_bank?: string;
  to_bank?: string;
  account_id?: string;
  currency?: string;
  payment_format?: string;
  min_amount?: number;
  max_amount?: number;
  start_date?: string;
  end_date?: string;
  prediction?: number;
  sort_by?: string;
  sort_order?: string;
}

export const getTransactions = (filters: TransactionFilters = {}) =>
  client.get('/transactions', { params: filters }).then((r) => r.data);

export const getTransactionDetail = (id: string) =>
  client.get(`/transactions/${id}`).then((r) => r.data);
