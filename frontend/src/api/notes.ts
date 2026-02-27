import client from './client';

export const getNotes = (transactionId: string) =>
  client.get(`/transactions/${transactionId}/notes`).then((r) => r.data);

export const createNote = (transactionId: string, content: string, author: string) =>
  client.post(`/transactions/${transactionId}/notes`, { content, author }).then((r) => r.data);
