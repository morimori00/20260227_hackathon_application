import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Feature {
  feature: string;
  importance: number;
}

interface FeatureImportanceChartProps {
  features: Feature[];
  maxItems?: number;
}

export default function FeatureImportanceChart({ features, maxItems = 5 }: FeatureImportanceChartProps) {
  const data = features.slice(0, maxItems).map((f) => ({
    name: f.feature.length > 20 ? f.feature.slice(0, 20) + '...' : f.feature,
    value: f.importance,
    fullName: f.feature,
  }));

  return (
    <ResponsiveContainer width="100%" height={maxItems * 36 + 20}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
        <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} fontSize={11} />
        <YAxis type="category" dataKey="name" width={140} fontSize={11} />
        <Tooltip
          formatter={(v: any, _: any, p: any) => [`${(Number(v) * 100).toFixed(1)}%`, p.payload.fullName]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? '#2f80ed' : i === 1 ? '#4a9af5' : '#93c5fd'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
