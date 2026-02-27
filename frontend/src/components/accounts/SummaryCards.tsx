import { Card, CardContent } from '@/components/ui/card';

interface SummaryCardsProps {
  summary: {
    total_transactions: number;
    total_sent: number;
    total_received: number;
    flagged_transactions: number;
  };
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const items = [
    { label: 'Total Transactions', value: summary.total_transactions.toLocaleString() },
    { label: 'Total Sent', value: `$${summary.total_sent.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Total Received', value: `$${summary.total_received.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Flagged', value: summary.flagged_transactions.toLocaleString(), highlight: summary.flagged_transactions > 0 },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className={`text-lg font-bold ${item.highlight ? 'text-destructive' : ''}`}>
              {item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
