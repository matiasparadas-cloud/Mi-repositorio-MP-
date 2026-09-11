import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sync", () => ({
  runSync: vi.fn(),
}));

import { runSync } from "@/lib/sync";
import { GET } from "./route";

const ORIGINAL_SECRET = process.env.CRON_SECRET;

describe("GET /api/sync", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    vi.mocked(runSync).mockReset();
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_SECRET;
  });

  it("rechaza la solicitud si no se envía el secreto correcto", async () => {
    const request = new NextRequest("http://localhost/api/sync");
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(runSync).not.toHaveBeenCalled();
  });

  it("rechaza la solicitud si el secreto es incorrecto", async () => {
    const request = new NextRequest("http://localhost/api/sync?secret=otro-valor");
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(runSync).not.toHaveBeenCalled();
  });

  it("ejecuta la sincronización y devuelve 200 cuando el secreto es correcto y la corrida es exitosa", async () => {
    vi.mocked(runSync).mockResolvedValue({
      status: "SUCCESS",
      rowsProcessed: 10,
      syncRunId: "run-1",
    });

    const request = new NextRequest("http://localhost/api/sync?secret=test-secret");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("SUCCESS");
    expect(runSync).toHaveBeenCalledTimes(1);
  });

  it("devuelve 500 cuando la sincronización falla", async () => {
    vi.mocked(runSync).mockResolvedValue({
      status: "FAILED",
      rowsProcessed: 0,
      errorMessage: "Graph API no responde",
      syncRunId: "run-2",
    });

    const request = new NextRequest("http://localhost/api/sync?secret=test-secret");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.errorMessage).toMatch(/Graph API no responde/);
  });

  it("también acepta el secreto vía header Authorization: Bearer (compatible con Vercel Cron)", async () => {
    vi.mocked(runSync).mockResolvedValue({ status: "SUCCESS", rowsProcessed: 1, syncRunId: "run-3" });

    const request = new NextRequest("http://localhost/api/sync", {
      headers: { authorization: "Bearer test-secret" },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});
