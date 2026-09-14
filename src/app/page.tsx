"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { DashboardFilters, type DatePreset, type DimensionFilterValues } from "@/components/DashboardFilters";
import { StatTile } from "@/components/StatTile";
import { GrowthChip } from "@/components/GrowthChip";
import { BreakdownChart } from "@/components/BreakdownChart";
import { formatCLP, formatNumber, formatPercent } from "@/lib/format";
import { getCalendarMonthRange, getCalendarWeekRange } from "@/lib/metrics";
import type { FilterOptions } from "@/lib/dashboard-filter-options";
import type { BreakdownDimension, BreakdownRow, DashboardResult } from "@/lib/dashboard-query";

const GROUP_BY_OPTIONS: { value: BreakdownDimension; label: string }[] = [
  { value: "brand", label: "Marca" },
  { value: "category", label: "Categoría" },
  { value: "product", label: "Producto" },
  { value: "salesperson", label: "Vendedor" },
  { value: "zone", label: "Zona" },
];

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeRange(preset: DatePreset, customFrom: string, customTo: string): { from: Date; to: Date } {
  const now = new Date();
  if (preset === "week") {
    const { start, end } = getCalendarWeekRange(now);
    return { from: start, to: end };
  }
  if (preset === "month") {
    const { start, end } = getCalendarMonthRange(now);
    return { from: start, to: end };
  }

  const from = customFrom ? new Date(`${customFrom}T00:00:00.000Z`) : getCalendarWeekRange(now).start;
  const toBase = customTo ? new Date(`${customTo}T00:00:00.000Z`) : getCalendarWeekRange(now).end;
  const to = new Date(toBase.getTime() + 24 * 60 * 60 * 1000); // el input es inclusivo -> lo hacemos exclusivo
  return { from, to };
}

function buildQuery(from: Date, to: Date, values: DimensionFilterValues, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString(), ...extra });
  if (values.brand) params.set("brand", values.brand);
  if (values.category) params.set("category", values.category);
  if (values.salespersonId) params.set("salespersonId", values.salespersonId);
  if (values.zoneId) params.set("zoneId", values.zoneId);
  return params.toString();
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  const initialWeek = useMemo(() => getCalendarWeekRange(new Date()), []);
  const [preset, setPreset] = useState<DatePreset>("week");
  const [customFrom, setCustomFrom] = useState(toDateInputValue(initialWeek.start));
  const [customTo, setCustomTo] = useState(toDateInputValue(new Date(initialWeek.end.getTime() - 86400000)));
  const [dimensionValues, setDimensionValues] = useState<DimensionFilterValues>({});
  const [groupBy, setGroupBy] = useState<BreakdownDimension>("brand");

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResult | null>(null);
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/filters")
      .then((r) => r.json())
      .then(setFilterOptions)
      .catch(() => setError("No se pudieron cargar las opciones de filtro."));
  }, []);

  useEffect(() => {
    const { from, to } = computeRange(preset, customFrom, customTo);
    setLoading(true);
    setError(null);

    const metricsQuery = buildQuery(from, to, dimensionValues);
    const breakdownQuery = buildQuery(from, to, dimensionValues, { groupBy });

    Promise.all([
      fetch(`/api/dashboard?${metricsQuery}`).then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar el resumen del panel.");
        return r.json();
      }),
      fetch(`/api/dashboard/breakdown?${breakdownQuery}`).then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar el desglose.");
        return r.json();
      }),
    ])
      .then(([metrics, breakdown]) => {
        setDashboardData(metrics);
        setBreakdownRows(breakdown);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo, dimensionValues, groupBy]);

  const totals = dashboardData?.totals;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">BI de Ventas</h1>
        <div className="flex items-center gap-3 text-sm">
          {isAdmin && (
            <a href="/admin/usuarios" className="text-brand-text hover:underline">
              Usuarios
            </a>
          )}
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="text-gray-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </header>

      <DashboardFilters
        options={filterOptions}
        preset={preset}
        onPresetChange={setPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomRangeChange={(from, to) => {
          setCustomFrom(from);
          setCustomTo(to);
        }}
        values={dimensionValues}
        onValuesChange={setDimensionValues}
      />

      {error && <p className="rounded bg-status-critical/10 px-3 py-2 text-sm text-status-critical">{error}</p>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Ventas"
          value={totals ? formatCLP(totals.totalAmount) : "—"}
          secondaryValue={totals ? `${formatNumber(totals.totalQuantity)} unidades` : undefined}
        />
        <StatTile
          label="Margen"
          value={totals ? formatCLP(totals.marginAmount) : "—"}
          secondaryValue={totals ? formatPercent(totals.marginPercent) : undefined}
        />
        <StatTile label="Crecimiento YoY" value={dashboardData ? formatPercent(dashboardData.yoy.salesAmountGrowth) : "—"}>
          {dashboardData && <GrowthChip value={dashboardData.yoy.salesAmountGrowth} label="vs año anterior" />}
        </StatTile>
        <StatTile
          label="Crecimiento WoW"
          value={dashboardData?.wow ? formatPercent(dashboardData.wow.salesAmountGrowth) : "Sin datos"}
        >
          {dashboardData?.wow ? (
            <GrowthChip value={dashboardData.wow.salesAmountGrowth} label="vs semana anterior" />
          ) : (
            <p className="text-xs text-gray-500">Solo disponible viendo &quot;Esta semana&quot;.</p>
          )}
        </StatTile>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-black">Ventas por {GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label.toLowerCase()}</h2>
          <div className="flex overflow-hidden rounded border border-gray-300 text-xs">
            {GROUP_BY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGroupBy(option.value)}
                className={`px-2.5 py-1 font-medium ${
                  groupBy === option.value ? "bg-brand-800 text-white" : "bg-white text-gray-700 hover:bg-brand-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <BreakdownChart rows={breakdownRows} loading={loading} />
      </section>
    </main>
  );
}
