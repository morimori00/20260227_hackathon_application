import client from './client';

export const getAccount = (accountId: string) =>
  client.get(`/accounts/${accountId}`).then((r) => r.data);

export const getAccountTransactions = (
  accountId: string,
  params: {
    page?: number;
    per_page?: number;
    direction?: string;
    start_date?: string;
    end_date?: string;
  } = {}
) => client.get(`/accounts/${accountId}/transactions`, { params }).then((r) => r.data);

export const getCounterparties = (
  accountId: string,
  params: {
    direction?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
  } = {}
) => client.get(`/accounts/${accountId}/counterparties`, { params }).then((r) => r.data);

export const getTimeline = (
  accountId: string,
  params: { start_date?: string; end_date?: string } = {}
) => client.get(`/accounts/${accountId}/timeline`, { params }).then((r) => r.data);
