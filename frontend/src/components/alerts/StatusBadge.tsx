import { useState, useRef, useEffect } from 'react';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-400', label: 'Pending' },
  investigating: { color: 'bg-blue-500', label: 'Investigating' },
  resolved: { color: 'bg-green-500', label: 'Resolved' },
  false_positive: { color: 'bg-gray-400', label: 'False Positive' },
};

const ALL_STATUSES = ['pending', 'investigating', 'resolved', 'false_positive'];

interface StatusBadgeProps {
  status: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function StatusBadge({ status, onStatusChange }: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onStatusChange) setOpen(!open);
        }}
        className="flex items-center gap-2 text-xs"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
        <span>{config.label}</span>
      </button>
      {open && onStatusChange && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-border rounded-md shadow-md py-1 min-w-[140px]">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(s);
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].color}`} />
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
