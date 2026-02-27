import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Loading from '@/components/layout/Loading';
import NetworkGraph from '@/components/network/NetworkGraph';
import PatternPanel from '@/components/network/PatternPanel';
import { getNetwork } from '@/api/network';
import { searchAccounts } from '@/api/master';

export default function NetworkPage() {
  const [accountId, setAccountId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [hops, setHops] = useState(2);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [networkData, setNetworkData] = useState<any>(null);
  const [highlightedTxnIds, setHighlightedTxnIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(entry.contentRect.height, 500),
        });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (searchQuery.length < 1) { setSuggestions([]); return; }
    const timeout = setTimeout(() => {
      searchAccounts(searchQuery, 8).then((r) => setSuggestions(r.data));
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchNetwork = async (accId?: string) => {
    const target = accId || accountId;
    if (!target) return;
    setLoading(true);
    setHighlightedTxnIds([]);
    try {
      const res = await getNetwork({
        account_id: target,
        hops,
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      });
      setNetworkData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectAccount = (accId: string) => {
    setAccountId(accId);
    setSearchQuery(accId);
    setSuggestions([]);
    fetchNetwork(accId);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Input
              placeholder="Search account ID..."
              className="h-8 w-56 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchNetwork(); }}
            />
            {suggestions.length > 0 && (
              <div className="absolute z-50 top-full left-0 mt-1 bg-white border rounded-md shadow-md w-full max-h-[200px] overflow-auto">
                {suggestions.map((s: any) => (
                  <button
                    key={s.account_id}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent"
                    onClick={() => selectAccount(s.account_id)}
                  >
                    <div className="font-mono">{s.account_id}</div>
                    <div className="text-[10px] text-muted-foreground">{s.bank_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Hops:</span>
            <select
              className="h-8 text-xs border rounded px-2"
              value={hops}
              onChange={(e) => setHops(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <Input type="date" className="h-8 w-36 text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" className="h-8 w-36 text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button size="sm" onClick={() => fetchNetwork()} className="h-8 text-xs">Search</Button>
        </div>

        <div ref={containerRef} className="flex-1 relative">
          {loading ? (
            <Loading />
          ) : networkData ? (
            <>
              <NetworkGraph
                nodes={networkData.nodes}
                edges={networkData.edges}
                highlightedTxnIds={highlightedTxnIds}
                width={dimensions.width}
                height={dimensions.height}
              />
              {networkData.truncated && (
                <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded">
                  Network truncated due to size limits
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex gap-3 bg-white/90 p-2 rounded border text-[10px]">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#2f80ed]" /> Origin</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#eb5757]" /> High Risk</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#f2994a]" /> Medium</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#9b9a97]" /> Low</div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Enter an account ID and click Search to view the network
            </div>
          )}
        </div>
      </div>

      {networkData && networkData.patterns.length > 0 && (
        <div className="w-[280px] border-l p-4 overflow-auto">
          <PatternPanel
            patterns={networkData.patterns}
            onPatternClick={(p) => setHighlightedTxnIds(p.transaction_ids)}
          />
        </div>
      )}
    </div>
  );
}
