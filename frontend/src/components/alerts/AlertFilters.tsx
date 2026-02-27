import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getBanks, getCurrencies, getPaymentFormats } from '@/api/master';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'false_positive', label: 'False Positive' },
];

interface Filters {
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
}

interface AlertFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function AlertFilters({ filters, onFiltersChange }: AlertFiltersProps) {
  const [banks, setBanks] = useState<{ bank_id: string; bank_name: string }[]>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [paymentFormats, setPaymentFormats] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    filters.status ? filters.status.split(',') : []
  );

  useEffect(() => {
    getBanks().then((r) => setBanks(r.data));
    getCurrencies().then((r) => setCurrencies(r.data));
    getPaymentFormats().then((r) => setPaymentFormats(r.data));
  }, []);

  const toggleStatus = (s: string) => {
    const next = selectedStatuses.includes(s)
      ? selectedStatuses.filter((x) => x !== s)
      : [...selectedStatuses, s];
    setSelectedStatuses(next);
    onFiltersChange({ ...filters, status: next.join(',') || undefined });
  };

  const updateFilter = (key: keyof Filters, value: string | number | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const reset = () => {
    setSelectedStatuses([]);
    onFiltersChange({});
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => toggleStatus(s.value)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              selectedStatuses.includes(s.value)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white text-foreground border-border hover:bg-accent'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <select
          className="h-8 text-xs border border-border rounded-md px-2 bg-white"
          value={filters.from_bank || ''}
          onChange={(e) => updateFilter('from_bank', e.target.value)}
        >
          <option value="">From Bank</option>
          {banks.map((b) => (
            <option key={b.bank_id} value={b.bank_id}>{b.bank_name}</option>
          ))}
        </select>
        <select
          className="h-8 text-xs border border-border rounded-md px-2 bg-white"
          value={filters.to_bank || ''}
          onChange={(e) => updateFilter('to_bank', e.target.value)}
        >
          <option value="">To Bank</option>
          {banks.map((b) => (
            <option key={b.bank_id} value={b.bank_id}>{b.bank_name}</option>
          ))}
        </select>
        <select
          className="h-8 text-xs border border-border rounded-md px-2 bg-white"
          value={filters.currency || ''}
          onChange={(e) => updateFilter('currency', e.target.value)}
        >
          <option value="">Currency</option>
          {currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="h-8 text-xs border border-border rounded-md px-2 bg-white"
          value={filters.payment_format || ''}
          onChange={(e) => updateFilter('payment_format', e.target.value)}
        >
          <option value="">Payment Format</option>
          {paymentFormats.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="Min Amount"
          className="h-8 w-28 text-xs"
          value={filters.min_amount ?? ''}
          onChange={(e) => updateFilter('min_amount', e.target.value ? Number(e.target.value) : undefined)}
        />
        <Input
          type="number"
          placeholder="Max Amount"
          className="h-8 w-28 text-xs"
          value={filters.max_amount ?? ''}
          onChange={(e) => updateFilter('max_amount', e.target.value ? Number(e.target.value) : undefined)}
        />
        <Input
          type="date"
          className="h-8 w-36 text-xs"
          value={filters.start_date || ''}
          onChange={(e) => updateFilter('start_date', e.target.value)}
        />
        <Input
          type="date"
          className="h-8 w-36 text-xs"
          value={filters.end_date || ''}
          onChange={(e) => updateFilter('end_date', e.target.value)}
        />
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Score:</span>
          <Input
            type="number"
            placeholder="0.0"
            step="0.1"
            min="0"
            max="1"
            className="h-8 w-16 text-xs"
            value={filters.min_score ?? ''}
            onChange={(e) => updateFilter('min_score', e.target.value ? Number(e.target.value) : undefined)}
          />
          <span className="text-xs">-</span>
          <Input
            type="number"
            placeholder="1.0"
            step="0.1"
            min="0"
            max="1"
            className="h-8 w-16 text-xs"
            value={filters.max_score ?? ''}
            onChange={(e) => updateFilter('max_score', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="h-8 text-xs">
          Reset
        </Button>
      </div>
    </div>
  );
}
