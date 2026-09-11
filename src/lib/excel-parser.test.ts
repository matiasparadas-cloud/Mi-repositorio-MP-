import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseSalesWorkbook, DEFAULT_COLUMN_MAPPING, type ColumnMapping } from "./excel-parser";

async function buildWorkbookBuffer(headers: string[], rows: (string | number)[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Ventas");
  sheet.addRow(headers);
  for (const row of rows) sheet.addRow(row);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

const HEADERS = [
  "Fecha",
  "Producto",
  "Marca",
  "Categoría",
  "Vendedor",
  "Zona",
  "Cantidad",
  "Precio Unitario",
  "Costo Unitario",
];

describe("parseSalesWorkbook", () => {
  it("parsea filas válidas con el mapeo de columnas por defecto", async () => {
    const buffer = await buildWorkbookBuffer(HEADERS, [
      ["2026-09-01", "Whey Protein 1kg", "AllNutrition", "Suplementos", "Juan Pérez", "Santiago Centro", 3, 15000, 9000],
      ["2026-09-02", "Creatina 300g", "AllNutrition", "Suplementos", "Ana Soto", "Norte", 2, 12000, 7000],
    ]);

    const result = await parseSalesWorkbook(buffer);

    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      productName: "Whey Protein 1kg",
      brand: "AllNutrition",
      category: "Suplementos",
      salesperson: "Juan Pérez",
      zone: "Santiago Centro",
      quantity: 3,
      unitPrice: 15000,
      unitCost: 9000,
    });
    expect(result.rows[0].date.toISOString().slice(0, 10)).toBe("2026-09-01");
  });

  it("ignora filas completamente vacías", async () => {
    const buffer = await buildWorkbookBuffer(HEADERS, [
      ["2026-09-01", "Whey Protein 1kg", "AllNutrition", "Suplementos", "Juan Pérez", "Santiago Centro", 3, 15000, 9000],
      [],
    ]);

    const result = await parseSalesWorkbook(buffer);

    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("acumula errores por fila inválida (sin detener el resto del archivo)", async () => {
    const buffer = await buildWorkbookBuffer(HEADERS, [
      ["2026-09-01", "Whey Protein 1kg", "AllNutrition", "Suplementos", "Juan Pérez", "Santiago Centro", 3, 15000, 9000],
      ["fecha-invalida", "Creatina", "AllNutrition", "Suplementos", "Ana Soto", "Norte", 2, 12000, 7000],
      ["2026-09-03", "Shaker", "OtraMarca", "Accesorios", "Ana Soto", "Norte", -1, 5000, 3000],
      ["2026-09-04", "", "AllNutrition", "Suplementos", "Ana Soto", "Norte", 1, 1000, 500],
    ]);

    const result = await parseSalesWorkbook(buffer);

    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]).toMatchObject({ row: 3 });
    expect(result.errors[1]).toMatchObject({ row: 4 });
    expect(result.errors[2]).toMatchObject({ row: 5 });
  });

  it("lanza un error descriptivo si faltan columnas requeridas en el encabezado", async () => {
    const buffer = await buildWorkbookBuffer(
      ["Fecha", "Producto", "Cantidad"],
      [["2026-09-01", "Whey Protein 1kg", 3]]
    );

    await expect(parseSalesWorkbook(buffer)).rejects.toThrowError(/Marca, Categoría, Vendedor, Zona, Precio Unitario, Costo Unitario/);
  });

  it("acepta un mapeo de columnas personalizado", async () => {
    const customMapping: ColumnMapping = {
      ...DEFAULT_COLUMN_MAPPING,
      productName: "Nombre Producto",
      unitPrice: "Precio",
    };
    const buffer = await buildWorkbookBuffer(
      ["Fecha", "Nombre Producto", "Marca", "Categoría", "Vendedor", "Zona", "Cantidad", "Precio", "Costo Unitario"],
      [["2026-09-01", "Whey Protein 1kg", "AllNutrition", "Suplementos", "Juan Pérez", "Santiago Centro", 3, 15000, 9000]]
    );

    const result = await parseSalesWorkbook(buffer, customMapping);

    expect(result.errors).toHaveLength(0);
    expect(result.rows[0].productName).toBe("Whey Protein 1kg");
    expect(result.rows[0].unitPrice).toBe(15000);
  });
});
