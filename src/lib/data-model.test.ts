import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";

describe("modelo de datos de ventas", () => {
  beforeEach(async () => {
    await prisma.saleLine.deleteMany();
    await prisma.product.deleteMany();
    await prisma.salesperson.deleteMany();
    await prisma.zone.deleteMany();
    await prisma.syncRun.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("guarda una línea de venta con sus dimensiones y permite leerla de vuelta", async () => {
    const product = await prisma.product.create({
      data: { name: "Whey Protein 1kg", brand: "AllNutrition", category: "Suplementos" },
    });
    const salesperson = await prisma.salesperson.create({ data: { name: "Juan Pérez" } });
    const zone = await prisma.zone.create({ data: { name: "Santiago Centro" } });

    const saleLine = await prisma.saleLine.create({
      data: {
        date: new Date("2026-09-01"),
        productId: product.id,
        salespersonId: salesperson.id,
        zoneId: zone.id,
        quantity: 3,
        unitPrice: 15000,
        unitCost: 9000,
      },
      include: { product: true, salesperson: true, zone: true },
    });

    expect(saleLine.quantity).toBe(3);
    expect(saleLine.unitPrice.toNumber()).toBe(15000);
    expect(saleLine.unitCost.toNumber()).toBe(9000);
    expect(saleLine.product.brand).toBe("AllNutrition");
    expect(saleLine.product.category).toBe("Suplementos");
    expect(saleLine.salesperson.name).toBe("Juan Pérez");
    expect(saleLine.zone.name).toBe("Santiago Centro");
  });

  it("permite filtrar líneas de venta combinando marca y zona", async () => {
    const [brandA, brandB] = await Promise.all([
      prisma.product.create({ data: { name: "Creatina", brand: "AllNutrition", category: "Suplementos" } }),
      prisma.product.create({ data: { name: "Shaker", brand: "OtraMarca", category: "Accesorios" } }),
    ]);
    const seller = await prisma.salesperson.create({ data: { name: "Ana Soto" } });
    const [zoneA, zoneB] = await Promise.all([
      prisma.zone.create({ data: { name: "Norte" } }),
      prisma.zone.create({ data: { name: "Sur" } }),
    ]);

    await prisma.saleLine.createMany({
      data: [
        { date: new Date(), productId: brandA.id, salespersonId: seller.id, zoneId: zoneA.id, quantity: 1, unitPrice: 10000, unitCost: 6000 },
        { date: new Date(), productId: brandB.id, salespersonId: seller.id, zoneId: zoneB.id, quantity: 2, unitPrice: 5000, unitCost: 3000 },
      ],
    });

    const filtered = await prisma.saleLine.findMany({
      where: { product: { brand: "AllNutrition" }, zone: { name: "Norte" } },
    });

    expect(filtered).toHaveLength(1);
  });

  it("registra una corrida de sincronización con su resultado", async () => {
    const run = await prisma.syncRun.create({
      data: { status: "SUCCESS", rowsProcessed: 42 },
    });

    expect(run.status).toBe("SUCCESS");
    expect(run.rowsProcessed).toBe(42);
    expect(run.startedAt).toBeInstanceOf(Date);
  });
});
