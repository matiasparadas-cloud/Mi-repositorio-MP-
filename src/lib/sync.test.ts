import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { runSync, type SyncDependencies } from "./sync";
import type { ParsedSaleRow, ParseResult } from "./excel-parser";

const row = (overrides: Partial<ParsedSaleRow> = {}): ParsedSaleRow => ({
  date: new Date("2026-09-01"),
  productName: "Whey Protein 1kg",
  brand: "AllNutrition",
  category: "Suplementos",
  salesperson: "Juan Pérez",
  zone: "Santiago Centro",
  quantity: 3,
  unitPrice: 15000,
  unitCost: 9000,
  ...overrides,
});

function depsWithParseResult(result: ParseResult): SyncDependencies {
  return {
    downloadExcel: async () => Buffer.from("fake-xlsx-bytes"),
    parseWorkbook: async () => result,
  };
}

function depsWithDownloadFailure(message: string): SyncDependencies {
  return {
    downloadExcel: async () => {
      throw new Error(message);
    },
    parseWorkbook: async () => ({ rows: [], errors: [] }),
  };
}

describe("runSync", () => {
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

  it("persiste las filas parseadas y registra un SyncRun exitoso", async () => {
    const result = await runSync(
      depsWithParseResult({
        rows: [row(), row({ productName: "Creatina 300g", quantity: 2, unitPrice: 12000, unitCost: 7000 })],
        errors: [],
      })
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.rowsProcessed).toBe(2);

    const saleLines = await prisma.saleLine.findMany();
    expect(saleLines).toHaveLength(2);

    const syncRuns = await prisma.syncRun.findMany();
    expect(syncRuns).toHaveLength(1);
    expect(syncRuns[0].status).toBe("SUCCESS");
    expect(syncRuns[0].rowsProcessed).toBe(2);
  });

  it("es idempotente: correr dos veces el mismo dataset no duplica filas ni dimensiones", async () => {
    const deps = depsWithParseResult({ rows: [row()], errors: [] });

    await runSync(deps);
    await runSync(deps);

    expect(await prisma.saleLine.count()).toBe(1);
    expect(await prisma.product.count()).toBe(1);
    expect(await prisma.salesperson.count()).toBe(1);
    expect(await prisma.zone.count()).toBe(1);
    expect(await prisma.syncRun.count()).toBe(2);
  });

  it("reutiliza dimensiones ya creadas por su clave natural en vez de duplicarlas", async () => {
    await runSync(depsWithParseResult({ rows: [row()], errors: [] }));
    await runSync(
      depsWithParseResult({
        rows: [row({ zone: "Santiago Centro", salesperson: "Juan Pérez", quantity: 5 })],
        errors: [],
      })
    );

    expect(await prisma.product.count()).toBe(1);
    expect(await prisma.salesperson.count()).toBe(1);
    expect(await prisma.zone.count()).toBe(1);
    expect(await prisma.saleLine.count()).toBe(1);

    const [saleLine] = await prisma.saleLine.findMany();
    expect(saleLine.quantity).toBe(5);
  });

  it("descarta solo las filas inválidas y persiste las válidas cuando hay errores parciales", async () => {
    const result = await runSync(
      depsWithParseResult({
        rows: [row()],
        errors: [{ row: 5, message: "Cantidad inválida" }],
      })
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.rowsProcessed).toBe(1);

    const syncRun = (await prisma.syncRun.findMany())[0];
    expect(syncRun.errorMessage).toMatch(/1 fila.*omitida/i);
  });

  it("registra una corrida fallida sin tocar los datos previos cuando la descarga de OneDrive falla", async () => {
    await runSync(depsWithParseResult({ rows: [row()], errors: [] }));
    expect(await prisma.saleLine.count()).toBe(1);

    const result = await runSync(depsWithDownloadFailure("Graph API no responde"));

    expect(result.status).toBe("FAILED");
    expect(await prisma.saleLine.count()).toBe(1); // datos previos intactos

    const syncRuns = await prisma.syncRun.findMany({ orderBy: { startedAt: "asc" } });
    expect(syncRuns).toHaveLength(2);
    expect(syncRuns[1].status).toBe("FAILED");
    expect(syncRuns[1].errorMessage).toMatch(/Graph API no responde/);
  });

  it("registra una corrida fallida sin tocar los datos previos cuando el Excel es inválido (parseo falla)", async () => {
    await runSync(depsWithParseResult({ rows: [row()], errors: [] }));

    const deps: SyncDependencies = {
      downloadExcel: async () => Buffer.from("fake"),
      parseWorkbook: async () => {
        throw new Error("Faltan columnas requeridas en el Excel: Marca");
      },
    };
    const result = await runSync(deps);

    expect(result.status).toBe("FAILED");
    expect(result.errorMessage).toMatch(/Faltan columnas requeridas/);
    expect(await prisma.saleLine.count()).toBe(1);
  });

  it("marca la corrida como fallida si no hay ninguna fila válida para persistir", async () => {
    const result = await runSync(
      depsWithParseResult({ rows: [], errors: [{ row: 2, message: "Fecha inválida" }] })
    );

    expect(result.status).toBe("FAILED");
    expect(await prisma.saleLine.count()).toBe(0);
  });
});
