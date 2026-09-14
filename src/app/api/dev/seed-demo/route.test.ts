import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-seed", () => ({
  seedDemoData: vi.fn(),
}));

import { seedDemoData } from "@/lib/demo-seed";
import { POST } from "./route";

const ORIGINAL_SECRET = process.env.DEMO_SEED_SECRET;

function request(body: unknown) {
  return new Request("http://localhost/api/dev/seed-demo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/dev/seed-demo", () => {
  beforeEach(() => {
    vi.mocked(seedDemoData).mockReset();
  });

  afterEach(() => {
    process.env.DEMO_SEED_SECRET = ORIGINAL_SECRET;
  });

  it("rechaza si DEMO_SEED_SECRET no está configurado (deshabilitado por defecto)", async () => {
    delete process.env.DEMO_SEED_SECRET;

    const response = await POST(request({ secret: "cualquiera" }));

    expect(response.status).toBe(401);
    expect(seedDemoData).not.toHaveBeenCalled();
  });

  it("rechaza si el secreto no coincide", async () => {
    process.env.DEMO_SEED_SECRET = "secreto-correcto";

    const response = await POST(request({ secret: "secreto-incorrecto" }));

    expect(response.status).toBe(401);
    expect(seedDemoData).not.toHaveBeenCalled();
  });

  it("siembra los datos de ejemplo cuando el secreto coincide", async () => {
    process.env.DEMO_SEED_SECRET = "secreto-correcto";
    vi.mocked(seedDemoData).mockResolvedValue({ products: 6, salespersons: 3, zones: 3, saleLines: 400 });

    const response = await POST(request({ secret: "secreto-correcto" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.saleLines).toBe(400);
    expect(seedDemoData).toHaveBeenCalledTimes(1);
  });
});
