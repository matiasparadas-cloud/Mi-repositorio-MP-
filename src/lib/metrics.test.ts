import { describe, expect, it } from "vitest";
import {
  calculateSalesTotals,
  calculateMargin,
  calculateGrowth,
  getCalendarWeekRange,
  getPreviousCalendarWeekRange,
  getYoyPreviousPeriodRange,
  getCalendarMonthRange,
  calculatePeriodGrowth,
  type SaleLineMetric,
} from "./metrics";

const line = (quantity: number, unitPrice: number, unitCost: number): SaleLineMetric => ({
  quantity,
  unitPrice,
  unitCost,
});

describe("calculateSalesTotals", () => {
  it("suma monto y cantidad de todas las líneas", () => {
    const lines = [line(3, 15000, 9000), line(2, 5000, 3000)];
    expect(calculateSalesTotals(lines)).toEqual({ totalAmount: 55000, totalQuantity: 5 });
  });

  it("devuelve 0/0 para una lista vacía", () => {
    expect(calculateSalesTotals([])).toEqual({ totalAmount: 0, totalQuantity: 0 });
  });
});

describe("calculateMargin", () => {
  it("calcula margen $ y % sobre varias líneas", () => {
    const lines = [line(3, 15000, 9000), line(2, 5000, 3000)];
    // margen $ = 3*(15000-9000) + 2*(5000-3000) = 18000 + 4000 = 22000
    // ventas $ = 55000 -> margen % = 22000/55000 = 0.4
    const result = calculateMargin(lines);
    expect(result.marginAmount).toBe(22000);
    expect(result.marginPercent).toBeCloseTo(0.4, 5);
  });

  it("devuelve margen % nulo cuando no hubo ventas (división por cero)", () => {
    const result = calculateMargin([]);
    expect(result.marginAmount).toBe(0);
    expect(result.marginPercent).toBeNull();
  });
});

describe("calculateGrowth", () => {
  it("calcula el crecimiento porcentual entre dos períodos", () => {
    expect(calculateGrowth(120, 100)).toBeCloseTo(0.2, 5);
    expect(calculateGrowth(80, 100)).toBeCloseTo(-0.2, 5);
  });

  it("devuelve null cuando el período base es 0 (sin datos para comparar)", () => {
    expect(calculateGrowth(500, 0)).toBeNull();
    expect(calculateGrowth(0, 0)).toBeNull();
  });
});

describe("getCalendarWeekRange", () => {
  it("devuelve el rango lunes 00:00 (incl.) a lunes siguiente 00:00 (excl.), UTC", () => {
    // Miércoles 2026-09-09 UTC -> semana del lunes 2026-09-07 al lunes 2026-09-14
    const { start, end } = getCalendarWeekRange(new Date("2026-09-09T15:30:00Z"));
    expect(start.toISOString()).toBe("2026-09-07T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-14T00:00:00.000Z");
  });

  it("un domingo pertenece a la semana que empezó el lunes anterior", () => {
    const { start, end } = getCalendarWeekRange(new Date("2026-09-13T10:00:00Z"));
    expect(start.toISOString()).toBe("2026-09-07T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-14T00:00:00.000Z");
  });
});

describe("getPreviousCalendarWeekRange", () => {
  it("devuelve la semana calendario inmediatamente anterior", () => {
    const { start, end } = getPreviousCalendarWeekRange(new Date("2026-09-09T15:30:00Z"));
    expect(start.toISOString()).toBe("2026-08-31T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-07T00:00:00.000Z");
  });
});

describe("getYoyPreviousPeriodRange", () => {
  it("retrocede exactamente un año calendario manteniendo la duración del período", () => {
    const start = new Date("2026-09-01T00:00:00Z");
    const end = new Date("2026-10-01T00:00:00Z");
    const result = getYoyPreviousPeriodRange(start, end);
    expect(result.start.toISOString()).toBe("2025-09-01T00:00:00.000Z");
    expect(result.end.toISOString()).toBe("2025-10-01T00:00:00.000Z");
  });

  it("maneja el caso 29 de febrero cayendo en año no bisiesto", () => {
    const start = new Date("2028-02-29T00:00:00Z");
    const end = new Date("2028-03-01T00:00:00Z");
    const result = getYoyPreviousPeriodRange(start, end);
    // JS normaliza 2027-02-29 (año no bisiesto) a 2027-03-01
    expect(result.start.toISOString()).toBe("2027-03-01T00:00:00.000Z");
  });
});

describe("calculatePeriodGrowth", () => {
  it("compara ventas $, cantidad y margen $ entre período actual y anterior", () => {
    const current = [line(3, 15000, 9000), line(2, 5000, 3000)]; // ventas 55000, cant 5, margen 22000
    const previous = [line(2, 10000, 6000)]; // ventas 20000, cant 2, margen 8000

    const result = calculatePeriodGrowth(current, previous);

    expect(result.salesAmountGrowth).toBeCloseTo((55000 - 20000) / 20000, 5);
    expect(result.salesQuantityGrowth).toBeCloseTo((5 - 2) / 2, 5);
    expect(result.marginAmountGrowth).toBeCloseTo((22000 - 8000) / 8000, 5);
  });

  it("devuelve null en todos los campos si el período anterior no tuvo ventas", () => {
    const current = [line(1, 1000, 500)];
    const result = calculatePeriodGrowth(current, []);

    expect(result.salesAmountGrowth).toBeNull();
    expect(result.salesQuantityGrowth).toBeNull();
    expect(result.marginAmountGrowth).toBeNull();
  });
});

describe("getCalendarMonthRange", () => {
  it("devuelve el 1ro del mes (incl.) al 1ro del mes siguiente (excl.), UTC", () => {
    const { start, end } = getCalendarMonthRange(new Date("2026-09-14T15:30:00Z"));
    expect(start.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("maneja diciembre cruzando al año siguiente", () => {
    const { start, end } = getCalendarMonthRange(new Date("2026-12-20T00:00:00Z"));
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
