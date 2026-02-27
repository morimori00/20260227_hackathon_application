import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface TransactionData {
  id: string;
  timestamp: string;
  from_bank_name: string;
  from_account: string;
  from_entity_name?: string;
  to_bank_name: string;
  to_account: string;
  to_entity_name?: string;
  amount_received: number;
  receiving_currency: string;
  amount_paid: number;
  payment_currency: string;
  payment_format: string;
  prediction: number;
  fraud_score: number;
}

export default function TransactionCard({ data }: { data: TransactionData }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Transaction {data.id}</h3>
          {data.prediction === 1 && (
            <Badge variant="destructive">Fraud Detected</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Sender</div>
            <div className="text-sm font-medium">{data.from_bank_name}</div>
            <div className="text-xs font-mono text-muted-foreground">{data.from_account}</div>
            {data.from_entity_name && (
              <div className="text-xs text-muted-foreground">{data.from_entity_name}</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Receiver</div>
            <div className="text-sm font-medium">{data.to_bank_name}</div>
            <div className="text-xs font-mono text-muted-foreground">{data.to_account}</div>
            {data.to_entity_name && (
              <div className="text-xs text-muted-foreground">{data.to_entity_name}</div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Date: </span>
            {new Date(data.timestamp).toLocaleString()}
          </div>
          <div>
            <span className="text-muted-foreground">Amount Paid: </span>
            {data.amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })} {data.payment_currency}
          </div>
          <div>
            <span className="text-muted-foreground">Amount Received: </span>
            {data.amount_received.toLocaleString(undefined, { minimumFractionDigits: 2 })} {data.receiving_currency}
          </div>
          <div>
            <span className="text-muted-foreground">Payment: </span>
            {data.payment_format}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
