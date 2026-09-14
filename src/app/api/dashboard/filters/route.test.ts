import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/dashboard-filter-options", () => ({
  getFilterOptions: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getFilterOptions } from "@/lib/dashboard-filter-options";
import { GET } from "./route";

const fakeOptions = {
  brands: ["AllNutrition"],
  categories: ["Suplementos"],
  salespersons: [{ id: "s1", name: "Juan Pérez" }],
  zones: [{ id: "z1", name: "Norte" }],
  products: [{ id: "p1", name: "Whey Protein", brand: "AllNutrition" }],
};

describe("GET /api/dashboard/filters", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getFilterOptions).mockReset();
  });

  it("rechaza si no hay sesión", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(getFilterOptions).not.toHaveBeenCalled();
  });

  it("devuelve las opciones de filtro para un usuario logueado", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1", role: "MEMBER" } } as never);
    vi.mocked(getFilterOptions).mockResolvedValue(fakeOptions);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(fakeOptions);
  });
});
