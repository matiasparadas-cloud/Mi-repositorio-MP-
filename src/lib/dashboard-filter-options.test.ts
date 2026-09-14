import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { getFilterOptions } from "./dashboard-filter-options";

describe("getFilterOptions", () => {
  beforeEach(async () => {
    await prisma.saleLine.deleteMany();
    await prisma.product.deleteMany();
    await prisma.salesperson.deleteMany();
    await prisma.zone.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("devuelve marcas y categorías únicas, y listas de vendedores/zonas/productos", async () => {
    await prisma.product.createMany({
      data: [
        { name: "Whey Protein", brand: "AllNutrition", category: "Suplementos" },
        { name: "Creatina", brand: "AllNutrition", category: "Suplementos" },
        { name: "Shaker", brand: "OtraMarca", category: "Accesorios" },
      ],
    });
    await prisma.salesperson.createMany({ data: [{ name: "Juan Pérez" }, { name: "Ana Soto" }] });
    await prisma.zone.createMany({ data: [{ name: "Norte" }, { name: "Sur" }] });

    const options = await getFilterOptions();

    expect(options.brands.sort()).toEqual(["AllNutrition", "OtraMarca"]);
    expect(options.categories.sort()).toEqual(["Accesorios", "Suplementos"]);
    expect(options.salespersons.map((s) => s.name).sort()).toEqual(["Ana Soto", "Juan Pérez"]);
    expect(options.zones.map((z) => z.name).sort()).toEqual(["Norte", "Sur"]);
    expect(options.products).toHaveLength(3);
    expect(options.products[0]).toHaveProperty("brand");
  });

  it("devuelve listas vacías si no hay datos aún", async () => {
    const options = await getFilterOptions();

    expect(options.brands).toEqual([]);
    expect(options.categories).toEqual([]);
    expect(options.salespersons).toEqual([]);
    expect(options.zones).toEqual([]);
    expect(options.products).toEqual([]);
  });
});
