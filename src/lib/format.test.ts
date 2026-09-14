import { describe, expect, it } from "vitest";
import { formatCLP, formatNumber, formatPercent } from "./format";

describe("formatCLP", () => {
  it("formatea montos en pesos chilenos sin decimales", () => {
    expect(formatCLP(15000)).toBe("$15.000");
    expect(formatCLP(0)).toBe("$0");
  });
});

describe("formatNumber", () => {
  it("formatea cantidades con separador de miles", () => {
    expect(formatNumber(12345)).toBe("12.345");
  });
});

describe("formatPercent", () => {
  it('devuelve "Sin datos" cuando el valor es null', () => {
    expect(formatPercent(null)).toBe("Sin datos");
  });

  it("formatea un crecimiento positivo con signo +", () => {
    expect(formatPercent(0.2)).toBe("+20,0%");
  });

  it("formatea un crecimiento negativo con signo -", () => {
    expect(formatPercent(-0.153)).toBe("-15,3%");
  });

  it("formatea cero como 0,0% sin signo", () => {
    expect(formatPercent(0)).toBe("0,0%");
  });
});
