import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

import { getToken } from "next-auth/jwt";
import { middleware } from "./middleware";

describe("middleware", () => {
  it("redirige a /login cuando no hay sesión", async () => {
    vi.mocked(getToken).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/dashboard");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("location")).toContain("callbackUrl=%2Fdashboard");
  });

  it("deja pasar a un usuario autenticado a una ruta normal", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: "1", username: "juan", role: "MEMBER" } as never);

    const request = new NextRequest("http://localhost/dashboard");
    const response = await middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirige a un usuario MEMBER que intenta entrar a /admin", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: "1", username: "juan", role: "MEMBER" } as never);

    const request = new NextRequest("http://localhost/admin/usuarios");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).not.toContain("/login");
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("deja pasar a un usuario ADMIN a /admin", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: "1", username: "ana", role: "ADMIN" } as never);

    const request = new NextRequest("http://localhost/admin/usuarios");
    const response = await middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });
});
