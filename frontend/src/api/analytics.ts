import client from './client';

interface DateFilter {
  start_date?: string;
  end_date?: string;
}

export const getHeatmap = (params: DateFilter = {}) =>
  client.get('/analytics/heatmap', { params }).then((r) => r.data);

export const getCurrencyPaymentMatrix = (params: DateFilter = {}) =>
  client.get('/analytics/currency-payment-matrix', { params }).then((r) => r.data);

export const getHighRiskBanks = (
  params: DateFilter & { metric?: string; limit?: number } = {}
) => client.get('/analytics/high-risk-banks', { params }).then((r) => r.data);

export const getFeatureImportances = () =>
  client.get('/analytics/feature-importances').then((r) => r.data);

export const getPatternDistribution = (params: DateFilter = {}) =>
  client.get('/analytics/pattern-distribution', { params }).then((r) => r.data);
