import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/layout/Loading';
import Heatmap from '@/components/analytics/Heatmap';
import CurrencyPaymentMatrix from '@/components/analytics/CurrencyPaymentMatrix';
import HighRiskBanksChart from '@/components/analytics/HighRiskBanksChart';
import FeatureImportanceChart from '@/components/transactions/FeatureImportanceChart';
import PatternDistribution from '@/components/analytics/PatternDistribution';
import {
  getHeatmap, getCurrencyPaymentMatrix, getHighRiskBanks,
  getFeatureImportances, getPatternDistribution,
} from '@/api/analytics';

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [banksData, setBanksData] = useState<any[]>([]);
  const [featuresData, setFeaturesData] = useState<any[]>([]);
  const [patternData, setPatternData] = useState<any[]>([]);
  const [bankMetric, setBankMetric] = useState('count');

  const dateFilter = {
    ...(startDate ? { start_date: startDate } : {}),
    ...(endDate ? { end_date: endDate } : {}),
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [hm, mx, bk, ft, pt] = await Promise.all([
        getHeatmap(dateFilter),
        getCurrencyPaymentMatrix(dateFilter),
        getHighRiskBanks({ ...dateFilter, metric: bankMetric }),
        getFeatureImportances(),
        getPatternDistribution(dateFilter),
      ]);
      setHeatmapData(hm.data);
      setMatrixData(mx.data);
      setBanksData(bk.data);
      setFeaturesData(ft.data);
      setPatternData(pt.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [startDate, endDate]);

  useEffect(() => {
    getHighRiskBanks({ ...dateFilter, metric: bankMetric }).then((r) => setBanksData(r.data));
  }, [bankMetric]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <div className="flex items-center gap-2">
          <Input type="date" className="h-8 w-36 text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-xs">-</span>
          <Input type="date" className="h-8 w-36 text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button variant="outline" size="sm" className="text-xs" onClick={() => { setStartDate(''); setEndDate(''); }}>
            All Time
          </Button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-4">Fraud Transaction Heatmap (Day x Hour)</h3>
              <Heatmap data={heatmapData} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-4">Payment Format x Currency Fraud Rate</h3>
              <CurrencyPaymentMatrix data={matrixData} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-4">High Risk Banks (Top 10)</h3>
              <HighRiskBanksChart data={banksData} metric={bankMetric} onMetricChange={setBankMetric} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-4">Feature Importance</h3>
              <FeatureImportanceChart features={featuresData} maxItems={15} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-4">Pattern Distribution</h3>
              <PatternDistribution data={patternData} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
