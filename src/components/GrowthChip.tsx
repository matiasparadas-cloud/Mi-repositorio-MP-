import { formatPercent } from "@/lib/format";

export function GrowthChip({ value, label }: { value: number | null; label: string }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        <span aria-hidden>—</span>
        {label}: sin datos
      </span>
    );
  }

  const isPositive = value > 0;
  const isNegative = value < 0;
  const colorClasses = isPositive
    ? "bg-status-good/10 text-status-good"
    : isNegative
      ? "bg-status-critical/10 text-status-critical"
      : "bg-gray-100 text-gray-600";
  const arrow = isPositive ? "▲" : isNegative ? "▼" : "•";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClasses}`}>
      <span aria-hidden>{arrow}</span>
      {label}: {formatPercent(value)}
    </span>
  );
}
