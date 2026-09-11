import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, type AuthenticatedUser } from "@/lib/auth";
import { createUser } from "@/lib/users";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if ((session.user as AuthenticatedUser).role !== "ADMIN") {
    return { ok: false as const, response: NextResponse.json({ error: "Requiere rol ADMIN" }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const body = await request.json();
  const { username, password, role } = body as { username?: string; password?: string; role?: "ADMIN" | "MEMBER" };

  if (!username || !password) {
    return NextResponse.json({ error: "Usuario y clave son requeridos" }, { status: 400 });
  }

  try {
    const user = await createUser({ username, password, role });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
