import { describe, expect, it, vi } from "vitest";
import { downloadExcelFromSharedLink } from "./onedrive-share";

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

describe("downloadExcelFromSharedLink", () => {
  it("agrega download=1 al link (sin query previa) y devuelve el contenido", async () => {
    const fileBytes = new Uint8Array([80, 75, 3, 4]);
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      expect(String(input)).toBe("https://tenant-my.sharepoint.com/:x:/g/personal/abc/EXXXXX?download=1");
      return new Response(fileBytes, {
        status: 200,
        headers: { "content-type": XLSX_CONTENT_TYPE },
      });
    });

    const buffer = await downloadExcelFromSharedLink(
      "https://tenant-my.sharepoint.com/:x:/g/personal/abc/EXXXXX",
      fetchMock
    );

    expect(Buffer.compare(buffer, Buffer.from(fileBytes))).toBe(0);
  });

  it("agrega download=1 con & cuando el link ya tiene query string", async () => {
    const fileBytes = new Uint8Array([80, 75, 3, 4]);
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      expect(String(input)).toBe("https://tenant-my.sharepoint.com/:x:/g/personal/abc/EXXXXX?e=yyyy&download=1");
      return new Response(fileBytes, { status: 200, headers: { "content-type": XLSX_CONTENT_TYPE } });
    });

    await downloadExcelFromSharedLink("https://tenant-my.sharepoint.com/:x:/g/personal/abc/EXXXXX?e=yyyy", fetchMock);
  });

  it("lanza un error descriptivo si la respuesta HTTP no es exitosa", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response("Not Found", { status: 404 }));

    await expect(
      downloadExcelFromSharedLink("https://tenant-my.sharepoint.com/:x:/g/personal/abc/EXXXXX", fetchMock)
    ).rejects.toThrow(/No se pudo descargar el Excel desde el link de OneDrive.*404/);
  });

  it("lanza un error descriptivo si el link devuelve HTML en vez del archivo (link no público)", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("<html>inicia sesión</html>", { status: 200, headers: { "content-type": "text/html" } })
    );

    await expect(
      downloadExcelFromSharedLink("https://tenant-my.sharepoint.com/:x:/g/personal/abc/EXXXXX", fetchMock)
    ).rejects.toThrow(/no parece ser de acceso público/);
  });
});
