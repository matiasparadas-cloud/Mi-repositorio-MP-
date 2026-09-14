import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { seedDemoData } from "./demo-seed";

describe("seedDemoData", () => {
  beforeEach(async () => {
    await prisma.saleLine.deleteMany();
    await prisma.product.deleteMany();
    await prisma.salesperson.deleteMany();
    await prisma.zone.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("crea productos, vendedores, zonas y líneas de venta de ejemplo", async () => {
    const result = await seedDemoData();

    expect(result.products).toBeGreaterThan(0);
    expect(result.salespersons).toBeGreaterThan(0);
    expect(result.zones).toBeGreaterThan(0);
    expect(result.saleLines).toBeGreaterThan(0);

    expect(await prisma.product.count()).toBe(result.products);
    expect(await prisma.saleLine.count()).toBe(result.saleLines);
  });

  it("las fechas generadas caen dentro de los últimos ~100 días (hay datos para esta semana)", async () => {
    await seedDemoData();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentCount = await prisma.saleLine.count({ where: { date: { gte: weekAgo, lte: now } } });
    expect(recentCount).toBeGreaterThan(0);
  });

  it("es idempotente: correrlo de nuevo reemplaza los datos en vez de acumularlos", async () => {
    const first = await seedDemoData();
    const second = await seedDemoData();

    expect(await prisma.product.count()).toBe(second.products);
    expect(first.products).toBe(second.products);
  });
});
