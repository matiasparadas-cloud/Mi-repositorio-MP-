import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  secondaryValue,
  children,
}: {
  label: string;
  value: string;
  secondaryValue?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4">
      <div className="absolute left-0 top-0 h-full w-1 bg-brand-500" aria-hidden />
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-black">{value}</p>
      {secondaryValue && <p className="mt-0.5 text-sm text-gray-500">{secondaryValue}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
