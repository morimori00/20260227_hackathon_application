import { Badge } from '@/components/ui/badge';

interface AccountHeaderProps {
  data: {
    account_id: string;
    bank_name: string;
    entity_name?: string;
    summary: {
      flagged_transactions: number;
    };
  };
}

export default function AccountHeader({ data }: AccountHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold font-mono">{data.account_id}</h1>
        <div className="text-sm text-muted-foreground mt-1">{data.bank_name}</div>
        {data.entity_name && (
          <div className="text-xs text-muted-foreground">{data.entity_name}</div>
        )}
      </div>
      {data.summary.flagged_transactions > 0 && (
        <Badge variant="destructive">{data.summary.flagged_transactions} flagged</Badge>
      )}
    </div>
  );
}
