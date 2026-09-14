function toDirectDownloadUrl(shareUrl: string): string {
  const separator = shareUrl.includes("?") ? "&" : "?";
  return `${shareUrl}${separator}download=1`;
}

/**
 * Descarga el Excel desde un link de OneDrive compartido públicamente
 * ("Cualquiera con el link"), sin registrar ninguna aplicación en Azure ni
 * usar Microsoft Graph — decisión explícita del usuario, que prefirió esto
 * a manejar un registro de app y permisos de administrador. `download=1` es
 * un parámetro reconocido por OneDrive/SharePoint que fuerza la descarga
 * directa del archivo en vez de abrir la vista previa en el navegador.
 */
export async function downloadExcelFromSharedLink(
  shareUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<Buffer> {
  const url = toDirectDownloadUrl(shareUrl);
  const response = await fetchImpl(url);

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `No se pudo descargar el Excel desde el link de OneDrive (status ${response.status}). ${detail}`
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new Error(
      "El link de OneDrive no parece ser de acceso público (devolvió una página de inicio de sesión en vez del archivo). " +
        'Revisá que el link esté compartido como "Cualquiera con el link puede ver".'
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
