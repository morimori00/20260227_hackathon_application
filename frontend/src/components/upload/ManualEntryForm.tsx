import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TransactionRow } from '@/api/upload';

interface ManualEntryFormProps {
  onSubmit: (rows: TransactionRow[]) => void;
  loading: boolean;
}

const EMPTY_ROW: TransactionRow = {
  timestamp: '',
  from_bank: '',
  from_account: '',
  to_bank: '',
  to_account: '',
  amount_received: 0,
  receiving_currency: 'US Dollar',
  amount_paid: 0,
  payment_currency: 'US Dollar',
  payment_format: 'Wire',
};

const FIELDS: { key: keyof TransactionRow; label: string; type: string }[] = [
  { key: 'timestamp', label: 'Timestamp', type: 'datetime-local' },
  { key: 'from_bank', label: 'From Bank', type: 'text' },
  { key: 'from_account', label: 'From Account', type: 'text' },
  { key: 'to_bank', label: 'To Bank', type: 'text' },
  { key: 'to_account', label: 'To Account', type: 'text' },
  { key: 'amount_paid', label: 'Amount Paid', type: 'number' },
  { key: 'payment_currency', label: 'Payment Currency', type: 'text' },
  { key: 'amount_received', label: 'Amount Received', type: 'number' },
  { key: 'receiving_currency', label: 'Receiving Currency', type: 'text' },
  { key: 'payment_format', label: 'Payment Format', type: 'text' },
];

export default function ManualEntryForm({ onSubmit, loading }: ManualEntryFormProps) {
  const [currentRow, setCurrentRow] = useState<TransactionRow>({ ...EMPTY_ROW });
  const [queue, setQueue] = useState<TransactionRow[]>([]);

  const updateField = (key: keyof TransactionRow, value: string | number) => {
    setCurrentRow((prev) => ({ ...prev, [key]: value }));
  };

  const addToQueue = () => {
    if (!currentRow.timestamp || !currentRow.from_account || !currentRow.to_account) return;
    const row = { ...currentRow };
    if (row.timestamp.includes('T')) {
      row.timestamp = row.timestamp.replace('T', ' ');
    }
    setQueue((prev) => [...prev, row]);
    setCurrentRow({ ...EMPTY_ROW });
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (queue.length > 0) {
      onSubmit(queue);
      setQueue([]);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium mb-4">Add Transaction</h3>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground">{f.label}</label>
                <input
                  type={f.type}
                  className="w-full mt-1 px-2 py-1.5 text-sm border rounded bg-background"
                  value={currentRow[f.key]}
                  onChange={(e) =>
                    updateField(
                      f.key,
                      f.type === 'number' ? Number(e.target.value) : e.target.value
                    )
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="outline" onClick={addToQueue}>
              Add to Queue
            </Button>
          </div>
        </CardContent>
      </Card>

      {queue.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">
                Queued Rows ({queue.length})
              </h3>
              <Button size="sm" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit & Predict'}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-1 px-2">Timestamp</th>
                    <th className="text-left py-1 px-2">From</th>
                    <th className="text-left py-1 px-2">To</th>
                    <th className="text-right py-1 px-2">Amount</th>
                    <th className="text-left py-1 px-2">Format</th>
                    <th className="py-1 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-1 px-2">{row.timestamp}</td>
                      <td className="py-1 px-2">{row.from_account}</td>
                      <td className="py-1 px-2">{row.to_account}</td>
                      <td className="text-right py-1 px-2">
                        {row.amount_paid.toLocaleString()} {row.payment_currency}
                      </td>
                      <td className="py-1 px-2">{row.payment_format}</td>
                      <td className="py-1 px-2">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeFromQueue(i)}
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
