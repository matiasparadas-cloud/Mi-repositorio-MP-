import { describe, expect, it, vi } from "vitest";
import { downloadExcelFromOneDrive, type GraphClientConfig } from "./graph-client";

const config: GraphClientConfig = {
  tenantId: "tenant-123",
  clientId: "client-abc",
  clientSecret: "secret-xyz",
  driveId: "drive-1",
  itemId: "item-1",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("downloadExcelFromOneDrive", () => {
  it("obtiene un token con client credentials y descarga el contenido del archivo", async () => {
    const fileBytes = new Uint8Array([80, 75, 3, 4]); // firma de un .xlsx (zip)
    const fetchMock = vi.fn<typeof fetch>();

    fetchMock.mockImplementationOnce(async (input, init) => {
      expect(String(input)).toBe(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`);
      const body = String(init?.body);
      expect(body).toContain("grant_type=client_credentials");
      expect(body).toContain(`client_id=${config.clientId}`);
      expect(body).toContain(`client_secret=${config.clientSecret}`);
      expect(body).toContain("scope=https%3A%2F%2Fgraph.microsoft.com%2F.default");
      return jsonResponse({ access_token: "fake-token-123", expires_in: 3600, token_type: "Bearer" });
    });

    fetchMock.mockImplementationOnce(async (input, init) => {
      expect(String(input)).toBe(
        `https://graph.microsoft.com/v1.0/drives/${config.driveId}/items/${config.itemId}/content`
      );
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer fake-token-123");
      return new Response(fileBytes, { status: 200 });
    });

    const buffer = await downloadExcelFromOneDrive(config, fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(Buffer.compare(buffer, Buffer.from(fileBytes))).toBe(0);
  });

  it("lanza un error descriptivo si falla la obtención del token", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockImplementationOnce(async () => jsonResponse({ error: "invalid_client" }, 401));

    await expect(downloadExcelFromOneDrive(config, fetchMock)).rejects.toThrow(
      /No se pudo obtener el token de Microsoft Graph.*401/
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("lanza un error descriptivo si falla la descarga del archivo", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockImplementationOnce(async () =>
      jsonResponse({ access_token: "fake-token-123", expires_in: 3600, token_type: "Bearer" })
    );
    fetchMock.mockImplementationOnce(async () => new Response("Not Found", { status: 404 }));

    await expect(downloadExcelFromOneDrive(config, fetchMock)).rejects.toThrow(
      /No se pudo descargar el archivo desde OneDrive.*404/
    );
  });
});
