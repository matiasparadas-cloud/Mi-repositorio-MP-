export interface GraphClientConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  driveId: string;
  itemId: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

async function getAppOnlyAccessToken(
  config: GraphClientConfig,
  fetchImpl: typeof fetch
): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });

  const response = await fetchImpl(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `No se pudo obtener el token de Microsoft Graph (status ${response.status}). ${detail}`
    );
  }

  const data = (await response.json()) as TokenResponse;
  return data.access_token;
}

/**
 * Descarga el Excel de ventas desde OneDrive usando permisos de aplicación
 * (client credentials flow) — no depende de que un usuario haya iniciado sesión.
 * `fetchImpl` se puede inyectar para pruebas; en producción usa el fetch global.
 */
export async function downloadExcelFromOneDrive(
  config: GraphClientConfig,
  fetchImpl: typeof fetch = fetch
): Promise<Buffer> {
  const accessToken = await getAppOnlyAccessToken(config, fetchImpl);

  const contentUrl = `https://graph.microsoft.com/v1.0/drives/${config.driveId}/items/${config.itemId}/content`;
  const response = await fetchImpl(contentUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `No se pudo descargar el archivo desde OneDrive (status ${response.status}). ${detail}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
