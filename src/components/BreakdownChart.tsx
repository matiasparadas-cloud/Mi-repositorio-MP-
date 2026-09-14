"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCLP, formatNumber } from "@/lib/format";
import type { BreakdownRow } from "@/lib/dashboard-query";

const BRAND_ORANGE = "#FF9800";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: BreakdownRow }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-black">{row.key}</p>
      <p className="text-gray-600">
        <span className="font-semibold text-black">{formatCLP(row.salesAmount)}</span> · {formatNumber(row.salesQuantity)} un.
      </p>
    </div>
  );
}

export function BreakdownChart({ rows, loading }: { rows: BreakdownRow[]; loading?: boolean }) {
  if (!loading && rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">Sin ventas en este período para este filtro.</p>;
  }

  const height = Math.max(rows.length * 36, 120);

  return (
    <div style={{ opacity: loading ? 0.5 : 1 }} className="transition-opacity">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="#e1e0d9" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="key"
            width={120}
            tick={{ fontSize: 12, fill: "#52514e" }}
            axisLine={{ stroke: "#c3c2b7" }}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#FFF3E0" }} />
          <Bar dataKey="salesAmount" fill={BRAND_ORANGE} radius={[0, 4, 4, 0]} maxBarSize={22}>
            <LabelList
              dataKey="salesAmount"
              position="right"
              formatter={(value: number) => formatCLP(value)}
              style={{ fill: "#0b0b0b", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
