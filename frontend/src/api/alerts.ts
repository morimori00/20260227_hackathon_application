import client from './client';

export interface AlertFilters {
  page?: number;
  per_page?: number;
  status?: string;
  from_bank?: string;
  to_bank?: string;
  currency?: string;
  payment_format?: string;
  min_amount?: number;
  max_amount?: number;
  min_score?: number;
  max_score?: number;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: string;
}

export const getAlerts = (filters: AlertFilters = {}) =>
  client.get('/alerts', { params: filters }).then((r) => r.data);

export const getAlertSummary = () =>
  client.get('/alerts/summary').then((r) => r.data);

export const updateAlertStatus = (alertId: string, status: string) =>
  client.patch(`/alerts/${alertId}/status`, { status }).then((r) => r.data);
