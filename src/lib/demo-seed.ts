import { prisma } from "./prisma";

const PRODUCTS: [name: string, brand: string, category: string][] = [
  ["Whey Protein 1kg", "AllNutrition", "Suplementos"],
  ["Creatina 300g", "AllNutrition", "Suplementos"],
  ["BCAA 200cap", "AllNutrition", "Suplementos"],
  ["Shaker Pro", "GymGear", "Accesorios"],
  ["Guantes Training", "GymGear", "Accesorios"],
  ["Barra Proteica", "NutriPlus", "Snacks"],
];

const SALESPERSONS = ["Juan Pérez", "Ana Soto", "Carlos Reyes"];
const ZONES = ["Santiago Centro", "Norte", "Sur"];
const SALE_LINE_COUNT = 400;
const DAYS_OF_HISTORY = 100;

function randomDateInRange(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export interface SeedDemoDataResult {
  products: number;
  salespersons: number;
  zones: number;
  saleLines: number;
}

/**
 * Datos de ejemplo para que el usuario explore el panel en un navegador real
 * antes de conectar su Excel de verdad. Reemplaza (no acumula) los datos
 * existentes, así se puede volver a correr sin preocuparse por duplicados —
 * y una vez que la sincronización real con OneDrive esté andando, esa
 * corrida hace el mismo reemplazo completo, así que estos datos de ejemplo
 * desaparecen solos sin que haga falta borrarlos a mano.
 */
export async function seedDemoData(): Promise<SeedDemoDataResult> {
  await prisma.saleLine.deleteMany();
  await prisma.product.deleteMany();
  await prisma.salesperson.deleteMany();
  await prisma.zone.deleteMany();

  const productRows = await Promise.all(
    PRODUCTS.map(([name, brand, category]) => prisma.product.create({ data: { name, brand, category } }))
  );
  const salespersonRows = await Promise.all(SALESPERSONS.map((name) => prisma.salesperson.create({ data: { name } })));
  const zoneRows = await Promise.all(ZONES.map((name) => prisma.zone.create({ data: { name } })));

  const now = new Date();
  const start = new Date(now.getTime() - DAYS_OF_HISTORY * 24 * 60 * 60 * 1000);

  const lines = Array.from({ length: SALE_LINE_COUNT }, () => {
    const product = productRows[Math.floor(Math.random() * productRows.length)];
    const seller = salespersonRows[Math.floor(Math.random() * salespersonRows.length)];
    const zone = zoneRows[Math.floor(Math.random() * zoneRows.length)];
    const unitPrice = 5000 + Math.floor(Math.random() * 25000);
    const unitCost = Math.floor(unitPrice * (0.5 + Math.random() * 0.2));

    return {
      date: randomDateInRange(start, now),
      productId: product.id,
      salespersonId: seller.id,
      zoneId: zone.id,
      quantity: 1 + Math.floor(Math.random() * 5),
      unitPrice,
      unitCost,
    };
  });

  await prisma.saleLine.createMany({ data: lines });

  return {
    products: productRows.length,
    salespersons: salespersonRows.length,
    zones: zoneRows.length,
    saleLines: lines.length,
  };
}
