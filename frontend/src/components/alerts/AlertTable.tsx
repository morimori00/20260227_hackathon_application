import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import StatusBadge from './StatusBadge';

interface Alert {
  alert_id: string;
  transaction_id: string;
  status: string;
  fraud_score: number;
  timestamp: string;
  from_bank_id: string;
  from_bank_name: string;
  from_account: string;
  to_bank_id: string;
  to_bank_name: string;
  to_account: string;
  amount_paid: number;
  payment_currency: string;
  payment_format: string;
}

interface AlertTableProps {
  alerts: Alert[];
  sortBy: string;
  sortOrder: string;
  onSort: (col: string) => void;
  onStatusChange: (alertId: string, status: string) => void;
}

export default function AlertTable({ alerts, sortBy, sortOrder, onSort, onStatusChange }: AlertTableProps) {
  const navigate = useNavigate();

  const SortHeader = ({ col, children }: { col: string; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-accent text-xs select-none"
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortBy === col && (
          <span className="text-[10px]">{sortOrder === 'asc' ? '\u25B2' : '\u25BC'}</span>
        )}
      </span>
    </TableHead>
  );

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs w-[120px]">Status</TableHead>
            <SortHeader col="fraud_score">Score</SortHeader>
            <SortHeader col="timestamp">Time</SortHeader>
            <TableHead className="text-xs">From</TableHead>
            <TableHead className="text-xs">To</TableHead>
            <SortHeader col="amount_paid">Amount</SortHeader>
            <TableHead className="text-xs">Currency</TableHead>
            <TableHead className="text-xs">Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((a) => (
            <TableRow
              key={a.alert_id}
              className="cursor-pointer hover:bg-accent/50 text-xs"
              onClick={() => navigate(`/transactions/${a.transaction_id}`)}
            >
              <TableCell>
                <StatusBadge status={a.status} onStatusChange={(s) => onStatusChange(a.alert_id, s)} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${a.fraud_score * 100}%`,
                        backgroundColor: a.fraud_score > 0.7 ? '#eb5757' : a.fraud_score > 0.4 ? '#f2994a' : '#27ae60',
                      }}
                    />
                  </div>
                  <span className="font-mono">{(a.fraud_score * 100).toFixed(1)}%</span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">{new Date(a.timestamp).toLocaleString()}</TableCell>
              <TableCell>
                <div className="text-xs">{a.from_bank_name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{a.from_account}</div>
              </TableCell>
              <TableCell>
                <div className="text-xs">{a.to_bank_name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{a.to_account}</div>
              </TableCell>
              <TableCell className="font-mono text-right">{a.amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>{a.payment_currency}</TableCell>
              <TableCell>{a.payment_format}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
