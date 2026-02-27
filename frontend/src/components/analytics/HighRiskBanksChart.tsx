import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface BankEntry {
  bank_id: string;
  bank_name: string;
  fraud_transaction_count: number;
  fraud_total_amount: number;
}

interface HighRiskBanksChartProps {
  data: BankEntry[];
  onMetricChange: (metric: string) => void;
  metric: string;
}

export default function HighRiskBanksChart({ data, onMetricChange, metric }: HighRiskBanksChartProps) {
  const chartData = data.map((b) => ({
    name: b.bank_name.length > 18 ? b.bank_name.slice(0, 18) + '...' : b.bank_name,
    fullName: b.bank_name,
    count: b.fraud_transaction_count,
    amount: b.fraud_total_amount,
  }));

  return (
    <div>
      <Tabs value={metric} onValueChange={onMetricChange}>
        <TabsList>
          <TabsTrigger value="count" className="text-xs">By Count</TabsTrigger>
          <TabsTrigger value="amount" className="text-xs">By Amount</TabsTrigger>
        </TabsList>
        <TabsContent value={metric}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <XAxis
                type="number"
                fontSize={10}
                tickFormatter={(v) => metric === 'amount' ? `${(v / 1e6).toFixed(0)}M` : v.toLocaleString()}
              />
              <YAxis type="category" dataKey="name" width={150} fontSize={10} />
              <Tooltip
                formatter={(v: any) => metric === 'amount' ? `$${Number(v).toLocaleString()}` : Number(v).toLocaleString()}
                labelFormatter={(l: any, payload: any) => payload?.[0]?.payload?.fullName || l}
              />
              <Bar dataKey={metric === 'amount' ? 'amount' : 'count'} fill="#eb5757" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
