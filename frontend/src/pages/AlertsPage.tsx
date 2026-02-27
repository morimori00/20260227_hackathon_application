import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Loading from '@/components/layout/Loading';
import AlertFilters from '@/components/alerts/AlertFilters';
import AlertTable from '@/components/alerts/AlertTable';
import { getAlerts, getAlertSummary, updateAlertStatus } from '@/api/alerts';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [filters, setFilters] = useState<any>({});
  const [sortBy, setSortBy] = useState('fraud_score');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertRes, summaryRes] = await Promise.all([
        getAlerts({ ...filters, page, per_page: perPage, sort_by: sortBy, sort_order: sortOrder }),
        getAlertSummary(),
      ]);
      setAlerts(alertRes.data);
      setTotal(alertRes.meta.total);
      setSummary(summaryRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, page, perPage, sortBy, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleStatusChange = async (alertId: string, status: string) => {
    await updateAlertStatus(alertId, status);
    fetchData();
  };

  const handleFiltersChange = (f: any) => {
    setFilters(f);
    setPage(1);
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <h1 className="text-xl font-semibold">Alerts</h1>

      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Total Alerts</div>
              <div className="text-2xl font-bold">{summary.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{summary.by_status.pending.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Investigating</div>
              <div className="text-2xl font-bold text-blue-600">{summary.by_status.investigating.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Today New</div>
              <div className="text-2xl font-bold">{summary.today_new.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {loading ? (
        <Loading />
      ) : (
        <>
          <AlertTable
            alerts={alerts}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onStatusChange={handleStatusChange}
          />

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} of {total.toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-8 text-xs border rounded px-2"
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              >
                {[20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} / page</option>
                ))}
              </select>
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-xs">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
