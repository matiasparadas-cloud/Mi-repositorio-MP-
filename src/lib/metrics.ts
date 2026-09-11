export interface SaleLineMetric {
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface SalesTotals {
  totalAmount: number;
  totalQuantity: number;
}

export interface MarginResult {
  marginAmount: number;
  marginPercent: number | null;
}

export interface PeriodGrowth {
  salesAmountGrowth: number | null;
  salesQuantityGrowth: number | null;
  marginAmountGrowth: number | null;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export function calculateSalesTotals(lines: SaleLineMetric[]): SalesTotals {
  return lines.reduce<SalesTotals>(
    (totals, line) => ({
      totalAmount: totals.totalAmount + line.quantity * line.unitPrice,
      totalQuantity: totals.totalQuantity + line.quantity,
    }),
    { totalAmount: 0, totalQuantity: 0 }
  );
}

export function calculateMargin(lines: SaleLineMetric[]): MarginResult {
  const { totalAmount } = calculateSalesTotals(lines);
  const marginAmount = lines.reduce(
    (sum, line) => sum + line.quantity * (line.unitPrice - line.unitCost),
    0
  );

  return {
    marginAmount,
    marginPercent: totalAmount === 0 ? null : marginAmount / totalAmount,
  };
}

/**
 * Crecimiento porcentual de `current` respecto de `previous`.
 * Devuelve null cuando `previous` es 0: no hay base válida para comparar,
 * en vez de reportar un falso "+100%" o dividir por cero.
 */
export function calculateGrowth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

export function calculatePeriodGrowth(
  currentLines: SaleLineMetric[],
  previousLines: SaleLineMetric[]
): PeriodGrowth {
  const currentTotals = calculateSalesTotals(currentLines);
  const previousTotals = calculateSalesTotals(previousLines);
  const currentMargin = calculateMargin(currentLines);
  const previousMargin = calculateMargin(previousLines);

  return {
    salesAmountGrowth: calculateGrowth(currentTotals.totalAmount, previousTotals.totalAmount),
    salesQuantityGrowth: calculateGrowth(currentTotals.totalQuantity, previousTotals.totalQuantity),
    marginAmountGrowth: calculateGrowth(currentMargin.marginAmount, previousMargin.marginAmount),
  };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Semana calendario en UTC: lunes 00:00:00 (incluido) a lunes siguiente 00:00:00 (excluido).
 * Se usa UTC (no la zona horaria del servidor) para que el corte de semana no dependa
 * de dónde corre el proceso de sincronización.
 */
export function getCalendarWeekRange(referenceDate: Date): DateRange {
  const dayOfWeek = referenceDate.getUTCDay(); // 0 = domingo ... 6 = sábado
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const start = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
  );
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);

  const end = new Date(start.getTime() + 7 * MS_PER_DAY);

  return { start, end };
}

export function getPreviousCalendarWeekRange(referenceDate: Date): DateRange {
  const { start: currentWeekStart } = getCalendarWeekRange(referenceDate);
  const start = new Date(currentWeekStart.getTime() - 7 * MS_PER_DAY);
  const end = currentWeekStart;

  return { start, end };
}

/**
 * Retrocede exactamente un año calendario manteniendo la duración del período.
 * Para el 29 de febrero cayendo en año no bisiesto, usa el comportamiento estándar
 * de JS al fijar setUTCFullYear (normaliza a 1 de marzo).
 */
export function getYoyPreviousPeriodRange(start: Date, end: Date): DateRange {
  const previousStart = new Date(start.getTime());
  previousStart.setUTCFullYear(previousStart.getUTCFullYear() - 1);

  const previousEnd = new Date(end.getTime());
  previousEnd.setUTCFullYear(previousEnd.getUTCFullYear() - 1);

  return { start: previousStart, end: previousEnd };
}
