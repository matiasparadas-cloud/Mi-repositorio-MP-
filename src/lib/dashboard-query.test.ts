import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { getDashboardMetrics } from "./dashboard-query";

async function seedProduct(name: string, brand: string, category: string) {
  return prisma.product.create({ data: { name, brand, category } });
}
async function seedSalesperson(name: string) {
  return prisma.salesperson.create({ data: { name } });
}
async function seedZone(name: string) {
  return prisma.zone.create({ data: { name } });
}

describe("getDashboardMetrics", () => {
  beforeEach(async () => {
    await prisma.saleLine.deleteMany();
    await prisma.product.deleteMany();
    await prisma.salesperson.deleteMany();
    await prisma.zone.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("calcula totales y margen del rango, sin filtros de dimensión", async () => {
    const product = await seedProduct("Whey Protein", "AllNutrition", "Suplementos");
    const seller = await seedSalesperson("Juan Pérez");
    const zone = await seedZone("Santiago Centro");

    await prisma.saleLine.createMany({
      data: [
        { date: new Date("2026-09-08T12:00:00Z"), productId: product.id, salespersonId: seller.id, zoneId: zone.id, quantity: 2, unitPrice: 10000, unitCost: 6000 },
        { date: new Date("2026-09-09T12:00:00Z"), productId: product.id, salespersonId: seller.id, zoneId: zone.id, quantity: 1, unitPrice: 10000, unitCost: 6000 },
      ],
    });

    const result = await getDashboardMetrics({
      from: new Date("2026-09-07T00:00:00Z"),
      to: new Date("2026-09-14T00:00:00Z"),
    });

    expect(result.totals.totalAmount).toBe(30000);
    expect(result.totals.totalQuantity).toBe(3);
    expect(result.totals.marginAmount).toBe(12000);
    expect(result.totals.marginPercent).toBeCloseTo(0.4, 5);
  });

  it("filtra por marca y zona combinadas", async () => {
    const [productA, productB] = await Promise.all([
      seedProduct("Whey Protein", "AllNutrition", "Suplementos"),
      seedProduct("Shaker", "OtraMarca", "Accesorios"),
    ]);
    const seller = await seedSalesperson("Juan Pérez");
    const [zoneA, zoneB] = await Promise.all([seedZone("Norte"), seedZone("Sur")]);

    await prisma.saleLine.createMany({
      data: [
        { date: new Date("2026-09-08T12:00:00Z"), productId: productA.id, salespersonId: seller.id, zoneId: zoneA.id, quantity: 1, unitPrice: 10000, unitCost: 6000 },
        { date: new Date("2026-09-08T12:00:00Z"), productId: productB.id, salespersonId: seller.id, zoneId: zoneB.id, quantity: 5, unitPrice: 2000, unitCost: 1000 },
      ],
    });

    const result = await getDashboardMetrics({
      from: new Date("2026-09-07T00:00:00Z"),
      to: new Date("2026-09-14T00:00:00Z"),
      brand: "AllNutrition",
      zoneId: zoneA.id,
    });

    expect(result.totals.totalAmount).toBe(10000);
    expect(result.totals.totalQuantity).toBe(1);
  });

  it("calcula YoY comparando el mismo rango del año anterior, respetando los filtros", async () => {
    const product = await seedProduct("Whey Protein", "AllNutrition", "Suplementos");
    const seller = await seedSalesperson("Juan Pérez");
    const zone = await seedZone("Santiago Centro");

    await prisma.saleLine.createMany({
      data: [
        // período actual: 2026-09-01 a 2026-10-01
        { date: new Date("2026-09-15T12:00:00Z"), productId: product.id, salespersonId: seller.id, zoneId: zone.id, quantity: 2, unitPrice: 10000, unitCost: 6000 },
        // mismo período año anterior: 2025-09-01 a 2025-10-01
        { date: new Date("2025-09-15T12:00:00Z"), productId: product.id, salespersonId: seller.id, zoneId: zone.id, quantity: 1, unitPrice: 10000, unitCost: 6000 },
      ],
    });

    const result = await getDashboardMetrics({
      from: new Date("2026-09-01T00:00:00Z"),
      to: new Date("2026-10-01T00:00:00Z"),
    });

    // actual: 20000, anterior: 10000 -> +100%
    expect(result.yoy.salesAmountGrowth).toBeCloseTo(1, 5);
  });

  it("incluye WoW solo cuando el rango es exactamente la semana calendario actual", async () => {
    const product = await seedProduct("Whey Protein", "AllNutrition", "Suplementos");
    const seller = await seedSalesperson("Juan Pérez");
    const zone = await seedZone("Santiago Centro");

    await prisma.saleLine.createMany({
      data: [
        { date: new Date("2026-09-08T12:00:00Z"), productId: product.id, salespersonId: seller.id, zoneId: zone.id, quantity: 2, unitPrice: 10000, unitCost: 6000 },
        { date: new Date("2026-09-01T12:00:00Z"), productId: product.id, salespersonId: seller.id, zoneId: zone.id, quantity: 1, unitPrice: 10000, unitCost: 6000 },
      ],
    });

    const weekResult = await getDashboardMetrics({
      from: new Date("2026-09-07T00:00:00Z"), // lunes
      to: new Date("2026-09-14T00:00:00Z"), // lunes siguiente
    });
    expect(weekResult.wow).not.toBeNull();
    expect(weekResult.wow?.salesAmountGrowth).toBeCloseTo(1, 5); // 20000 vs 10000

    const monthResult = await getDashboardMetrics({
      from: new Date("2026-09-01T00:00:00Z"),
      to: new Date("2026-10-01T00:00:00Z"),
    });
    expect(monthResult.wow).toBeNull();
  });
});
