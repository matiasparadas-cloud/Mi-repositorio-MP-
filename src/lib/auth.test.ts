import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { createUser } from "./users";
import { verifyCredentials } from "./auth";

describe("verifyCredentials", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("devuelve el usuario (sin passwordHash) cuando usuario y clave son correctos", async () => {
    await createUser({ username: "juan", password: "clave-correcta-123", role: "ADMIN" });

    const result = await verifyCredentials("juan", "clave-correcta-123");

    expect(result).toMatchObject({ username: "juan", role: "ADMIN" });
    expect((result as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it("devuelve null si la clave es incorrecta", async () => {
    await createUser({ username: "juan", password: "clave-correcta-123" });

    const result = await verifyCredentials("juan", "clave-incorrecta");

    expect(result).toBeNull();
  });

  it("devuelve null si el usuario no existe", async () => {
    const result = await verifyCredentials("no-existe", "cualquier-clave");
    expect(result).toBeNull();
  });

  it("devuelve null si falta usuario o clave", async () => {
    expect(await verifyCredentials("", "")).toBeNull();
    expect(await verifyCredentials("juan", "")).toBeNull();
  });
});
