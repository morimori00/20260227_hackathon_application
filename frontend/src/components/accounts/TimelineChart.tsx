import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, Legend,
} from 'recharts';

interface TimelineEntry {
  date: string;
  sent_amount: number;
  received_amount: number;
  has_flagged: boolean;
}

export default function TimelineChart({ data }: { data: TimelineEntry[] }) {
  const flaggedDots = data.filter((d) => d.has_flagged);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <XAxis dataKey="date" fontSize={10} tickFormatter={(v) => v.slice(5)} />
        <YAxis fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(v: any) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          labelFormatter={(l) => `Date: ${l}`}
        />
        <Legend />
        <Line type="monotone" dataKey="sent_amount" stroke="#2f80ed" dot={false} strokeWidth={1.5} name="Sent" />
        <Line type="monotone" dataKey="received_amount" stroke="#27ae60" dot={false} strokeWidth={1.5} name="Received" />
        {flaggedDots.map((d, i) => (
          <ReferenceDot
            key={i}
            x={d.date}
            y={Math.max(d.sent_amount, d.received_amount)}
            r={4}
            fill="#eb5757"
            stroke="none"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
