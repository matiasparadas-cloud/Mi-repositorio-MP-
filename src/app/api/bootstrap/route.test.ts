import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { count: vi.fn() } },
}));
vi.mock("@/lib/users", () => ({
  createUser: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import { POST } from "./route";

const ORIGINAL_SECRET = process.env.BOOTSTRAP_SECRET;

function request(body: unknown) {
  return new Request("http://localhost/api/bootstrap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/bootstrap", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.count).mockReset();
    vi.mocked(createUser).mockReset();
  });

  afterEach(() => {
    process.env.BOOTSTRAP_SECRET = ORIGINAL_SECRET;
  });

  it("rechaza si BOOTSTRAP_SECRET no está configurado (deshabilitado por defecto)", async () => {
    delete process.env.BOOTSTRAP_SECRET;

    const response = await POST(request({ secret: "cualquiera", username: "admin", password: "clave-larga-123" }));

    expect(response.status).toBe(401);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rechaza si el secreto no coincide", async () => {
    process.env.BOOTSTRAP_SECRET = "secreto-correcto";

    const response = await POST(request({ secret: "secreto-incorrecto", username: "admin", password: "clave-larga-123" }));

    expect(response.status).toBe(401);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rechaza si ya existe algún usuario (se autodeshabilita después del primer uso)", async () => {
    process.env.BOOTSTRAP_SECRET = "secreto-correcto";
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const response = await POST(request({ secret: "secreto-correcto", username: "admin", password: "clave-larga-123" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/ya (se configuró|hay)/i);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rechaza si falta usuario o clave", async () => {
    process.env.BOOTSTRAP_SECRET = "secreto-correcto";
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const response = await POST(request({ secret: "secreto-correcto", username: "", password: "" }));

    expect(response.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("crea el primer admin cuando el secreto coincide y no hay usuarios todavía", async () => {
    process.env.BOOTSTRAP_SECRET = "secreto-correcto";
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(createUser).mockResolvedValue({
      id: "1",
      username: "admin",
      role: "ADMIN",
      passwordHash: "hash",
      createdAt: new Date(),
    } as never);

    const response = await POST(request({ secret: "secreto-correcto", username: "admin", password: "clave-larga-123" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.username).toBe("admin");
    expect(body.passwordHash).toBeUndefined();
    expect(createUser).toHaveBeenCalledWith({ username: "admin", password: "clave-larga-123", role: "ADMIN" });
  });
});
