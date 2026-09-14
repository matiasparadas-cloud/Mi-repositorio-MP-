"use client";

import type { FilterOptions } from "@/lib/dashboard-filter-options";

export type DatePreset = "week" | "month" | "custom";

export interface DimensionFilterValues {
  brand?: string;
  category?: string;
  salespersonId?: string;
  zoneId?: string;
}

export function DashboardFilters({
  options,
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomRangeChange,
  values,
  onValuesChange,
}: {
  options: FilterOptions | null;
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomRangeChange: (from: string, to: string) => void;
  values: DimensionFilterValues;
  onValuesChange: (values: DimensionFilterValues) => void;
}) {
  const selectClass =
    "rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-black focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex overflow-hidden rounded border border-gray-300">
        {(["week", "month", "custom"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onPresetChange(option)}
            className={`px-3 py-1.5 text-sm font-medium ${
              preset === option ? "bg-brand-800 text-white" : "bg-white text-gray-700 hover:bg-brand-50"
            }`}
          >
            {option === "week" ? "Esta semana" : option === "month" ? "Este mes" : "Personalizado"}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex items-center gap-1 text-sm">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomRangeChange(e.target.value, customTo)}
            className={selectClass}
            aria-label="Desde"
          />
          <span className="text-gray-400">–</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomRangeChange(customFrom, e.target.value)}
            className={selectClass}
            aria-label="Hasta"
          />
        </div>
      )}

      <select
        className={selectClass}
        value={values.brand ?? ""}
        onChange={(e) => onValuesChange({ ...values, brand: e.target.value || undefined })}
        aria-label="Marca"
      >
        <option value="">Todas las marcas</option>
        {options?.brands.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={values.category ?? ""}
        onChange={(e) => onValuesChange({ ...values, category: e.target.value || undefined })}
        aria-label="Categoría"
      >
        <option value="">Todas las categorías</option>
        {options?.categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={values.salespersonId ?? ""}
        onChange={(e) => onValuesChange({ ...values, salespersonId: e.target.value || undefined })}
        aria-label="Vendedor"
      >
        <option value="">Todos los vendedores</option>
        {options?.salespersons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={values.zoneId ?? ""}
        onChange={(e) => onValuesChange({ ...values, zoneId: e.target.value || undefined })}
        aria-label="Zona"
      >
        <option value="">Todas las zonas</option>
        {options?.zones.map((z) => (
          <option key={z.id} value={z.id}>
            {z.name}
          </option>
        ))}
      </select>
    </div>
  );
}
