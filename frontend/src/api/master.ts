import client from './client';

export const getBanks = () =>
  client.get('/master/banks').then((r) => r.data);

export const getCurrencies = () =>
  client.get('/master/currencies').then((r) => r.data);

export const getPaymentFormats = () =>
  client.get('/master/payment-formats').then((r) => r.data);

export const searchAccounts = (q: string, limit: number = 10) =>
  client.get('/accounts/search', { params: { q, limit } }).then((r) => r.data);
