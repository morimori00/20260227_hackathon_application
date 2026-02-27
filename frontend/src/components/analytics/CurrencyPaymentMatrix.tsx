import { useNavigate } from 'react-router-dom';

interface MatrixEntry {
  payment_format: string;
  currency: string;
  total_count: number;
  fraud_count: number;
  fraud_rate: number;
}

export default function CurrencyPaymentMatrix({ data }: { data: MatrixEntry[] }) {
  const navigate = useNavigate();

  const currencies = [...new Set(data.map((d) => d.currency))].sort();
  const formats = [...new Set(data.map((d) => d.payment_format))].sort();

  const lookup: Record<string, MatrixEntry> = {};
  data.forEach((d) => { lookup[`${d.payment_format}|${d.currency}`] = d; });

  const maxRate = Math.max(...data.map((d) => d.fraud_rate), 0.001);

  const getColor = (rate: number) => {
    if (rate === 0) return '#ffffff';
    const ratio = rate / maxRate;
    if (ratio < 0.25) return '#fef3c7';
    if (ratio < 0.5) return '#fde68a';
    if (ratio < 0.75) return '#f59e0b';
    return '#eb5757';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left border bg-muted/50">Format \ Currency</th>
            {currencies.map((c) => (
              <th key={c} className="p-2 text-center border bg-muted/50 whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {formats.map((fmt) => (
            <tr key={fmt}>
              <td className="p-2 border font-medium">{fmt}</td>
              {currencies.map((cur) => {
                const entry = lookup[`${fmt}|${cur}`];
                if (!entry) return <td key={cur} className="p-2 border text-center text-muted-foreground">-</td>;
                return (
                  <td
                    key={cur}
                    className="p-2 border text-center cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: getColor(entry.fraud_rate) }}
                    onClick={() => navigate(`/alerts?currency=${cur}&payment_format=${fmt}`)}
                    title={`Total: ${entry.total_count}, Fraud: ${entry.fraud_count}`}
                  >
                    {(entry.fraud_rate * 100).toFixed(2)}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
