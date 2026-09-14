import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  calculateMargin,
  calculatePeriodGrowth,
  calculateSalesTotals,
  getCalendarWeekRange,
  getPreviousCalendarWeekRange,
  getYoyPreviousPeriodRange,
  type MarginResult,
  type PeriodGrowth,
  type SaleLineMetric,
  type SalesTotals,
} from "./metrics";

export interface DashboardFilters {
  from: Date;
  to: Date;
  productId?: string;
  brand?: string;
  category?: string;
  salespersonId?: string;
  zoneId?: string;
}

export interface DashboardResult {
  range: { from: string; to: string };
  totals: SalesTotals & MarginResult;
  wow: PeriodGrowth | null;
  yoy: PeriodGrowth;
}

function buildWhere(
  filters: Omit<DashboardFilters, "from" | "to">,
  from: Date,
  to: Date
): Prisma.SaleLineWhereInput {
  return {
    date: { gte: from, lt: to },
    ...(filters.productId ? { productId: filters.productId } : {}),
    ...(filters.salespersonId ? { salespersonId: filters.salespersonId } : {}),
    ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
    ...(filters.brand || filters.category
      ? {
          product: {
            ...(filters.brand ? { brand: filters.brand } : {}),
            ...(filters.category ? { category: filters.category } : {}),
          },
        }
      : {}),
  };
}

async function fetchLines(
  filters: Omit<DashboardFilters, "from" | "to">,
  from: Date,
  to: Date
): Promise<SaleLineMetric[]> {
  const rows = await prisma.saleLine.findMany({
    where: buildWhere(filters, from, to),
    select: { quantity: true, unitPrice: true, unitCost: true },
  });

  return rows.map((row) => ({
    quantity: row.quantity,
    unitPrice: row.unitPrice.toNumber(),
    unitCost: row.unitCost.toNumber(),
  }));
}

export type BreakdownDimension = "product" | "brand" | "category" | "salesperson" | "zone";

export interface BreakdownRow {
  key: string;
  salesAmount: number;
  salesQuantity: number;
}

export async function getDashboardBreakdown(
  filters: DashboardFilters,
  dimension: BreakdownDimension,
  limit = 10
): Promise<BreakdownRow[]> {
  const { from, to, ...dimensionFilters } = filters;

  const rows = await prisma.saleLine.findMany({
    where: buildWhere(dimensionFilters, from, to),
    select: {
      quantity: true,
      unitPrice: true,
      product: { select: { name: true, brand: true, category: true } },
      salesperson: { select: { name: true } },
      zone: { select: { name: true } },
    },
  });

  const keyOf = (row: (typeof rows)[number]): string => {
    switch (dimension) {
      case "product":
        return row.product.name;
      case "brand":
        return row.product.brand;
      case "category":
        return row.product.category;
      case "salesperson":
        return row.salesperson.name;
      case "zone":
        return row.zone.name;
    }
  };

  const totals = new Map<string, BreakdownRow>();
  for (const row of rows) {
    const key = keyOf(row);
    const amount = row.quantity * row.unitPrice.toNumber();
    const existing = totals.get(key) ?? { key, salesAmount: 0, salesQuantity: 0 };
    existing.salesAmount += amount;
    existing.salesQuantity += row.quantity;
    totals.set(key, existing);
  }

  return Array.from(totals.values())
    .sort((a, b) => b.salesAmount - a.salesAmount)
    .slice(0, limit);
}

export async function getDashboardMetrics(filters: DashboardFilters): Promise<DashboardResult> {
  const { from, to, ...dimensionFilters } = filters;

  const currentLines = await fetchLines(dimensionFilters, from, to);
  const totals = calculateSalesTotals(currentLines);
  const margin = calculateMargin(currentLines);

  const yoyRange = getYoyPreviousPeriodRange(from, to);
  const yoyLines = await fetchLines(dimensionFilters, yoyRange.start, yoyRange.end);
  const yoy = calculatePeriodGrowth(currentLines, yoyLines);

  let wow: PeriodGrowth | null = null;
  const currentCalendarWeek = getCalendarWeekRange(from);
  const isExactCalendarWeek =
    from.getTime() === currentCalendarWeek.start.getTime() && to.getTime() === currentCalendarWeek.end.getTime();

  if (isExactCalendarWeek) {
    const previousWeek = getPreviousCalendarWeekRange(from);
    const previousWeekLines = await fetchLines(dimensionFilters, previousWeek.start, previousWeek.end);
    wow = calculatePeriodGrowth(currentLines, previousWeekLines);
  }

  return {
    range: { from: from.toISOString(), to: to.toISOString() },
    totals: { ...totals, ...margin },
    wow,
    yoy,
  };
}
