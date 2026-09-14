import { prisma } from "./prisma";

export interface FilterOptions {
  brands: string[];
  categories: string[];
  salespersons: { id: string; name: string }[];
  zones: { id: string; name: string }[];
  products: { id: string; name: string; brand: string }[];
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [products, salespersons, zones] = await Promise.all([
    prisma.product.findMany({ select: { id: true, name: true, brand: true, category: true }, orderBy: { name: "asc" } }),
    prisma.salesperson.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.zone.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return {
    brands,
    categories,
    salespersons,
    zones,
    products: products.map(({ id, name, brand }) => ({ id, name, brand })),
  };
}
