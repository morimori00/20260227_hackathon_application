import { Card, CardContent } from '@/components/ui/card';

interface Pattern {
  type: string;
  detail: string;
  transaction_ids: string[];
  total_amount: number;
}

interface PatternPanelProps {
  patterns: Pattern[];
  onPatternClick?: (pattern: Pattern) => void;
}

const TYPE_COLORS: Record<string, string> = {
  'FAN-OUT': '#eb5757',
  'FAN-IN': '#f2994a',
  'CYCLE': '#9b51e0',
  'BIPARTITE': '#2f80ed',
  'STACK': '#27ae60',
  'SCATTER-GATHER': '#f2c94c',
  'GATHER-SCATTER': '#56ccf2',
  'RANDOM': '#828282',
};

export default function PatternPanel({ patterns, onPatternClick }: PatternPanelProps) {
  if (patterns.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        No patterns detected in this network
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Detected Patterns ({patterns.length})</h3>
      {patterns.map((p, i) => (
        <Card
          key={i}
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onPatternClick?.(p)}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[p.type] || '#828282' }}
              />
              <span className="text-xs font-semibold">{p.type}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">{p.detail}</div>
            <div className="flex justify-between mt-1 text-[10px]">
              <span>{p.transaction_ids.length} transactions</span>
              <span className="font-mono">${p.total_amount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
