interface FraudScoreDisplayProps {
  score: number;
}

export default function FraudScoreDisplay({ score }: FraudScoreDisplayProps) {
  const pct = score * 100;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score * circumference);
  const color = score > 0.7 ? '#eb5757' : score > 0.4 ? '#f2994a' : '#27ae60';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e9e9e7" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">Fraud Score</span>
    </div>
  );
}
