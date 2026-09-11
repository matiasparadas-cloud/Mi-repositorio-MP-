import ExcelJS from "exceljs";

export interface ColumnMapping {
  date: string;
  productName: string;
  brand: string;
  category: string;
  salesperson: string;
  zone: string;
  quantity: string;
  unitPrice: string;
  unitCost: string;
}

export const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  date: "Fecha",
  productName: "Producto",
  brand: "Marca",
  category: "Categoría",
  salesperson: "Vendedor",
  zone: "Zona",
  quantity: "Cantidad",
  unitPrice: "Precio Unitario",
  unitCost: "Costo Unitario",
};

export interface ParsedSaleRow {
  date: Date;
  productName: string;
  brand: string;
  category: string;
  salesperson: string;
  zone: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface ParseRowError {
  row: number;
  message: string;
}

export interface ParseResult {
  rows: ParsedSaleRow[];
  errors: ParseRowError[];
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "").trim();
}

function isRowEmpty(row: ExcelJS.Row): boolean {
  let hasValue = false;
  row.eachCell({ includeEmpty: false }, (cell) => {
    if (cell.value !== null && cell.value !== undefined && String(cell.value).trim() !== "") {
      hasValue = true;
    }
  });
  return !hasValue;
}

function cellText(row: ExcelJS.Row, columnIndex: number): string {
  const value = row.getCell(columnIndex).value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in (value as object)) {
    return String((value as { text: unknown }).text ?? "").trim();
  }
  return String(value).trim();
}

function cellDate(row: ExcelJS.Row, columnIndex: number): Date | null {
  const value = row.getCell(columnIndex).value;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function cellNumber(row: ExcelJS.Row, columnIndex: number): number | null {
  const value = row.getCell(columnIndex).value;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * Parsea un libro de ventas en Excel a filas tipadas.
 * Falla rápido (throw) si faltan columnas requeridas en el encabezado — sin ellas
 * el archivo entero es inutilizable. Filas individuales inválidas (fecha corrupta,
 * cantidades negativas, campos vacíos) se acumulan como errores y se saltan,
 * para no descartar todo un día de ventas por un problema puntual en una fila.
 */
export async function parseSalesWorkbook(
  buffer: Buffer,
  mapping: ColumnMapping = DEFAULT_COLUMN_MAPPING
): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("El archivo Excel no tiene ninguna hoja.");
  }

  const headerRow = sheet.getRow(1);
  const columnIndexByHeader = new Map<string, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    columnIndexByHeader.set(normalizeHeader(cell.value), colNumber);
  });

  const requiredHeaders = Object.values(mapping);
  const missingHeaders = requiredHeaders.filter((header) => !columnIndexByHeader.has(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Faltan columnas requeridas en el Excel: ${missingHeaders.join(", ")}`);
  }

  const columnIndex = Object.fromEntries(
    Object.entries(mapping).map(([key, header]) => [key, columnIndexByHeader.get(header)!])
  ) as Record<keyof ColumnMapping, number>;

  const rows: ParsedSaleRow[] = [];
  const errors: ParseRowError[] = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (isRowEmpty(row)) continue;

    const date = cellDate(row, columnIndex.date);
    const productName = cellText(row, columnIndex.productName);
    const brand = cellText(row, columnIndex.brand);
    const category = cellText(row, columnIndex.category);
    const salesperson = cellText(row, columnIndex.salesperson);
    const zone = cellText(row, columnIndex.zone);
    const quantity = cellNumber(row, columnIndex.quantity);
    const unitPrice = cellNumber(row, columnIndex.unitPrice);
    const unitCost = cellNumber(row, columnIndex.unitCost);

    if (!date) {
      errors.push({ row: rowNumber, message: "Fecha inválida o vacía" });
      continue;
    }
    if (!productName) {
      errors.push({ row: rowNumber, message: "Producto vacío" });
      continue;
    }
    if (quantity === null || quantity <= 0) {
      errors.push({ row: rowNumber, message: "Cantidad inválida (debe ser un número mayor a 0)" });
      continue;
    }
    if (unitPrice === null || unitPrice < 0) {
      errors.push({ row: rowNumber, message: "Precio unitario inválido" });
      continue;
    }
    if (unitCost === null || unitCost < 0) {
      errors.push({ row: rowNumber, message: "Costo unitario inválido" });
      continue;
    }

    rows.push({ date, productName, brand, category, salesperson, zone, quantity, unitPrice, unitCost });
  }

  return { rows, errors };
}
