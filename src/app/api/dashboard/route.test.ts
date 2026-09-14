import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/dashboard-query", () => ({
  getDashboardMetrics: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getDashboardMetrics } from "@/lib/dashboard-query";
import { GET } from "./route";

function request(query = "") {
  return new Request(`http://localhost/api/dashboard${query}`);
}

const fakeResult = {
  range: { from: "2026-09-07T00:00:00.000Z", to: "2026-09-14T00:00:00.000Z" },
  totals: { totalAmount: 1000, totalQuantity: 1, marginAmount: 400, marginPercent: 0.4 },
  wow: null,
  yoy: { salesAmountGrowth: null, salesQuantityGrowth: null, marginAmountGrowth: null },
};

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getDashboardMetrics).mockReset();
  });

  it("rechaza si no hay sesión", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(getDashboardMetrics).not.toHaveBeenCalled();
  });

  it("permite a cualquier usuario logueado (MEMBER incluido), no solo ADMIN", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1", role: "MEMBER" } } as never);
    vi.mocked(getDashboardMetrics).mockResolvedValue(fakeResult as never);

    const response = await GET(request());

    expect(response.status).toBe(200);
  });

  it("usa la semana calendario actual por defecto si no se pasan from/to", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1", role: "MEMBER" } } as never);
    vi.mocked(getDashboardMetrics).mockResolvedValue(fakeResult as never);

    await GET(request());

    expect(getDashboardMetrics).toHaveBeenCalledTimes(1);
    const callArg = vi.mocked(getDashboardMetrics).mock.calls[0][0];
    expect(callArg.from).toBeInstanceOf(Date);
    expect(callArg.to).toBeInstanceOf(Date);
    expect(callArg.to.getTime() - callArg.from.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("pasa from/to y filtros de dimensión desde la query string", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1", role: "MEMBER" } } as never);
    vi.mocked(getDashboardMetrics).mockResolvedValue(fakeResult as never);

    await GET(
      request(
        "?from=2026-01-01T00:00:00.000Z&to=2026-02-01T00:00:00.000Z&brand=AllNutrition&zoneId=z1&category=Suplementos&salespersonId=s1&productId=p1"
      )
    );

    const callArg = vi.mocked(getDashboardMetrics).mock.calls[0][0];
    expect(callArg.from.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(callArg.to.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(callArg.brand).toBe("AllNutrition");
    expect(callArg.zoneId).toBe("z1");
    expect(callArg.category).toBe("Suplementos");
    expect(callArg.salespersonId).toBe("s1");
    expect(callArg.productId).toBe("p1");
  });

  it("devuelve 400 si from/to no son fechas válidas", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1", role: "MEMBER" } } as never);

    const response = await GET(request("?from=no-es-fecha&to=2026-02-01T00:00:00.000Z"));

    expect(response.status).toBe(400);
    expect(getDashboardMetrics).not.toHaveBeenCalled();
  });

  it("devuelve el resultado de getDashboardMetrics como JSON", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1", role: "MEMBER" } } as never);
    vi.mocked(getDashboardMetrics).mockResolvedValue(fakeResult as never);

    const response = await GET(request());
    const body = await response.json();

    expect(body).toEqual(fakeResult);
  });
});
