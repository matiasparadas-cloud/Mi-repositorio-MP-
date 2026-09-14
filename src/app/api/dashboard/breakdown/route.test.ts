import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/dashboard-query", () => ({
  getDashboardBreakdown: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getDashboardBreakdown } from "@/lib/dashboard-query";
import { GET } from "./route";

function request(query: string) {
  return new Request(`http://localhost/api/dashboard/breakdown${query}`);
}

const fakeRows = [{ key: "AllNutrition", salesAmount: 1000, salesQuantity: 2 }];

describe("GET /api/dashboard/breakdown", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getDashboardBreakdown).mockReset();
  });

  it("rechaza si no hay sesión", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await GET(request("?groupBy=brand"));

    expect(response.status).toBe(401);
    expect(getDashboardBreakdown).not.toHaveBeenCalled();
  });

  it("devuelve 400 si falta groupBy o no es una dimensión válida", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1", role: "MEMBER" } } as never);

    const missing = await GET(request(""));
    expect(missing.status).toBe(400);

    const invalid = await GET(request("?groupBy=no-existe"));
    expect(invalid.status).toBe(400);
    expect(getDashboardBreakdown).not.toHaveBeenCalled();
  });

  it("usa la semana calendario actual por defecto y pasa groupBy + filtros", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1", role: "MEMBER" } } as never);
    vi.mocked(getDashboardBreakdown).mockResolvedValue(fakeRows);

    const response = await GET(request("?groupBy=brand&zoneId=z1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(fakeRows);

    const [filtersArg, dimensionArg] = vi.mocked(getDashboardBreakdown).mock.calls[0];
    expect(dimensionArg).toBe("brand");
    expect(filtersArg.zoneId).toBe("z1");
    expect(filtersArg.from).toBeInstanceOf(Date);
    expect(filtersArg.to).toBeInstanceOf(Date);
  });
});
