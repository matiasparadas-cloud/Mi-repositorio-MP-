import { NextResponse } from "next/server";
import { seedDemoData } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";

/**
 * Carga datos de venta de ejemplo para que el usuario explore el panel real
 * antes de conectar su Excel. Deshabilitado a menos que DEMO_SEED_SECRET esté
 * configurado. No hace falta "limpiarlo" después: la primera sincronización
 * real con OneDrive reemplaza estos datos por completo (mismo mecanismo de
 * sync.ts), así que convive sin problema con el resto del sistema.
 */
export async function POST(request: Request) {
  const secret = process.env.DEMO_SEED_SECRET;
  const body = await request.json();
  const { secret: providedSecret } = body as { secret?: string };

  if (!secret || providedSecret !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await seedDemoData();
  return NextResponse.json(result, { status: 200 });
}
