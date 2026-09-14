import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";

export const dynamic = "force-dynamic";

/**
 * Crea el primer usuario ADMIN sin necesitar terminal: se visita una vez desde
 * el navegador (ver /bootstrap) con el secreto de BOOTSTRAP_SECRET. Se
 * autodeshabilita apenas existe un usuario en la base — no hay forma de volver
 * a usarlo por accidente ni que quede como puerta abierta permanente.
 */
export async function POST(request: Request) {
  const secret = process.env.BOOTSTRAP_SECRET;
  const body = await request.json();
  const { secret: providedSecret, username, password } = body as {
    secret?: string;
    username?: string;
    password?: string;
  };

  if (!secret || providedSecret !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return NextResponse.json(
      { error: "Ya hay usuarios configurados — este paso ya no está disponible." },
      { status: 403 }
    );
  }

  if (!username || !password) {
    return NextResponse.json({ error: "Usuario y clave son requeridos" }, { status: 400 });
  }

  try {
    const user = await createUser({ username, password, role: "ADMIN" });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
