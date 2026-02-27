import client from './client';

export interface NetworkParams {
  account_id: string;
  hops?: number;
  start_date?: string;
  end_date?: string;
}

export const getNetwork = (params: NetworkParams) =>
  client.get('/network', { params }).then((r) => r.data);
