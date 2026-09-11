import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/users", () => ({
  createUser: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: vi.fn() } },
}));

import { getServerSession } from "next-auth";
import { createUser } from "@/lib/users";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "./route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/admin/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/users", () => {
  it("rechaza si no hay sesión", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await POST(jsonRequest({ username: "nuevo", password: "clave-larga-123" }));

    expect(response.status).toBe(401);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rechaza si el usuario logueado no es ADMIN", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "1", username: "juan", role: "MEMBER" },
    } as never);

    const response = await POST(jsonRequest({ username: "nuevo", password: "clave-larga-123" }));

    expect(response.status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("crea el usuario cuando quien llama es ADMIN", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "1", username: "ana", role: "ADMIN" },
    } as never);
    vi.mocked(createUser).mockResolvedValue({
      id: "2",
      username: "nuevo",
      role: "MEMBER",
      passwordHash: "hash",
      createdAt: new Date(),
    } as never);

    const response = await POST(jsonRequest({ username: "nuevo", password: "clave-larga-123", role: "MEMBER" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.username).toBe("nuevo");
    expect(body.passwordHash).toBeUndefined();
    expect(createUser).toHaveBeenCalledWith({ username: "nuevo", password: "clave-larga-123", role: "MEMBER" });
  });

  it("devuelve 400 con el mensaje de error si createUser falla (ej. usuario duplicado)", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "1", username: "ana", role: "ADMIN" },
    } as never);
    vi.mocked(createUser).mockRejectedValue(new Error('El usuario "nuevo" ya existe.'));

    const response = await POST(jsonRequest({ username: "nuevo", password: "clave-larga-123" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/ya existe/);
  });
});

describe("GET /api/admin/users", () => {
  it("rechaza si quien llama no es ADMIN", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "1", username: "juan", role: "MEMBER" },
    } as never);

    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("lista los usuarios (sin passwordHash) para un ADMIN", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "1", username: "ana", role: "ADMIN" },
    } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "1", username: "ana", role: "ADMIN", createdAt: new Date() },
    ] as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].username).toBe("ana");
  });
});
