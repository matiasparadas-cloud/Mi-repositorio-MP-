import bcrypt from "bcryptjs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { createUser } from "./users";

describe("createUser", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("crea un usuario con la clave hasheada (no en texto plano)", async () => {
    const user = await createUser({ username: "juan", password: "clave-secreta-123", role: "MEMBER" });

    expect(user.username).toBe("juan");
    expect(user.role).toBe("MEMBER");

    const stored = await prisma.user.findUniqueOrThrow({ where: { username: "juan" } });
    expect(stored.passwordHash).not.toBe("clave-secreta-123");
    expect(await bcrypt.compare("clave-secreta-123", stored.passwordHash)).toBe(true);
  });

  it("por defecto crea usuarios con rol MEMBER", async () => {
    const user = await createUser({ username: "ana", password: "otra-clave-larga" });
    expect(user.role).toBe("MEMBER");
  });

  it("rechaza nombres de usuario duplicados", async () => {
    await createUser({ username: "juan", password: "clave-secreta-123" });

    await expect(createUser({ username: "juan", password: "otra-clave" })).rejects.toThrow(
      /ya existe/i
    );
  });

  it("rechaza claves demasiado cortas", async () => {
    await expect(createUser({ username: "pepe", password: "1234567" })).rejects.toThrow(
      /al menos 8 caracteres/i
    );
  });
});
