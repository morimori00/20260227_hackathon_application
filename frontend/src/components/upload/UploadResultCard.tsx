import { Card, CardContent } from '@/components/ui/card';
import type { UploadResult } from '@/api/upload';

interface UploadResultCardProps {
  result: UploadResult;
}

export default function UploadResultCard({ result }: UploadResultCardProps) {
  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-3">Upload Complete</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Total Rows</div>
            <div className="text-xl font-bold">{result.total_rows}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Flagged</div>
            <div className="text-xl font-bold text-red-600">
              {result.flagged_count}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">New Alerts</div>
            <div className="text-xl font-bold text-yellow-600">
              {result.new_alerts_count}
            </div>
          </div>
        </div>
        {result.flagged_count > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {result.flagged_count} suspicious transaction(s) detected. New alerts have been created.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
