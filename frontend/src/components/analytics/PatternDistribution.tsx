import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PatternEntry {
  pattern_type: string;
  count: number;
  total_amount: number;
}

const COLORS = ['#2f80ed', '#eb5757', '#f2994a', '#27ae60', '#9b51e0', '#f2c94c', '#56ccf2', '#828282'];

export default function PatternDistribution({ data }: { data: PatternEntry[] }) {
  return (
    <div className="flex items-center gap-8">
      <ResponsiveContainer width="50%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="pattern_type"
            innerRadius={60}
            outerRadius={110}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((p, i) => (
          <div key={p.pattern_type} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span>{p.pattern_type}</span>
            </div>
            <div className="text-right">
              <span className="font-medium">{p.count}</span>
              <span className="text-muted-foreground ml-2">${(p.total_amount / 1e6).toFixed(1)}M</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
