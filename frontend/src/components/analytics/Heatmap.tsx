import { Tooltip as ReactTooltip } from 'recharts';
import { useState } from 'react';

interface HeatmapEntry {
  day_of_week: string;
  hour: number;
  count: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Heatmap({ data }: { data: HeatmapEntry[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; entry: HeatmapEntry } | null>(null);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return '#f7f6f3';
    const ratio = count / maxCount;
    if (ratio < 0.25) return '#fef3c7';
    if (ratio < 0.5) return '#fde68a';
    if (ratio < 0.75) return '#f59e0b';
    return '#eb5757';
  };

  const grid: Record<string, Record<number, HeatmapEntry>> = {};
  DAYS.forEach((d) => { grid[d] = {}; });
  data.forEach((e) => { grid[e.day_of_week][e.hour] = e; });

  return (
    <div className="relative">
      <div className="flex">
        <div className="w-10" />
        <div className="flex-1 flex">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{i}</div>
          ))}
        </div>
      </div>
      {DAYS.map((day, di) => (
        <div key={day} className="flex items-center">
          <div className="w-10 text-[10px] text-muted-foreground text-right pr-2">{DAY_SHORT[di]}</div>
          <div className="flex-1 flex gap-[1px]">
            {Array.from({ length: 24 }, (_, hour) => {
              const entry = grid[day]?.[hour] || { day_of_week: day, hour, count: 0 };
              return (
                <div
                  key={hour}
                  className="flex-1 aspect-square rounded-[2px] cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: getColor(entry.count) }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ x: rect.left, y: rect.top - 40, entry });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        </div>
      ))}
      {tooltip && (
        <div
          className="fixed z-50 bg-foreground text-white text-xs px-2 py-1 rounded shadow pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.entry.day_of_week} {tooltip.entry.hour}:00 - {tooltip.entry.count} fraud txns
        </div>
      )}
    </div>
  );
}
