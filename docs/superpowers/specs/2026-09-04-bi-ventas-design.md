# Spec de diseño — Panel de BI de ventas

- **Fecha:** 2026-09-04
- **Estado:** Reconstruido a partir de la transcripción de la sesión de brainstorming original (el
  documento fuente no se conservó; este archivo recupera el mismo contenido de diseño acordado en
  esa conversación, sin volver a abrir decisiones ya tomadas).

## 1. Objetivo

Panel web de Business Intelligence (BI) de ventas para un equipo de 2 a 10 personas, que
reemplace la revisión manual del Excel de ventas con un dashboard visual, accesible desde un
navegador (Google Chrome u otro), enfocado en las métricas que más aportan a la toma de
decisiones.

## 2. Fuente de datos

- El archivo de ventas es un libro de Excel que vive en el **OneDrive (Microsoft 365)** del
  usuario.
- El archivo se actualiza a diario (carga manual del usuario, fuera del alcance de este sistema).
- Un **proceso automático (cron diario)** descarga el Excel.
  - **Decisión revisada en la Tarea 8 (2026-09-14):** el diseño original preveía Microsoft Graph
    API con permisos de aplicación (app-only, con consentimiento de administrador), pero el
    usuario prefirió evitar por completo el registro de una app en Azure AD y el paso de
    consentimiento de administrador. Se optó en cambio por un **link de OneDrive compartido
    como "Cualquiera con el link puede ver"**, descargado directamente (parámetro `download=1`).
    Esto elimina toda la complejidad de Azure (sin `MS_TENANT_ID`/`MS_CLIENT_ID`/
    `MS_CLIENT_SECRET`/`MS_DRIVE_ID`/`MS_EXCEL_ITEM_ID`, solo `ONEDRIVE_SHARE_URL`), a cambio de
    una contrapartida de seguridad explícita: el link funciona como una clave — cualquiera que lo
    consiga puede descargar el Excel de ventas sin autenticarse. El usuario aceptó ese trade-off
    de forma explícita, informado del riesgo. Ver `docs/superpowers/guides/onedrive-linking.md`.
- El proceso calcula las métricas del punto 3 y guarda los resultados en una base de datos
  **Postgres**.
- **El navegador nunca lee el Excel en vivo.** El dashboard siempre lee resultados ya calculados
  y persistidos en Postgres. Esto mantiene el panel rápido y no depende de la disponibilidad de
  Microsoft Graph en el momento en que alguien abre el panel.

## 3. Métricas

- **Ventas totales**: en pesos ($) y en cantidad de unidades.
- **Margen**: en pesos ($) y en porcentaje (%).
- **Crecimiento YoY** (year-over-year): comparación contra el mismo período del año anterior.
- **Crecimiento WoW** (week-over-week): comparación contra la semana anterior.

## 4. Filtros y desgloses

Las métricas anteriores deben poder desglosarse y filtrarse por:

- Producto
- Marca
- Categoría
- Vendedor
- Zona

Estas dimensiones son combinables (p. ej. ventas de una marca en una zona específica).

## 5. Autenticación

- Login propio del sistema, **usuario y clave** (no "Iniciar sesión con Microsoft").
- Decisión explícita: aunque el equipo ya usa Microsoft 365, se prefirió desacoplar el login de
  cada persona del equipo del acceso a OneDrive. El acceso a OneDrive se autoriza **una sola vez**,
  a nivel de aplicación (con consentimiento de administrador en Azure AD), independiente de quién
  inicia sesión en el panel.

## 6. Diseño visual

- Paleta de colores inspirada en **www.allnutrition.cl**: tonos **naranjo** como color de marca,
  sobre una base de **blanco y negro**.
- El hex exacto del naranjo de marca queda pendiente de confirmación visual (requiere inspeccionar
  el sitio con acceso a internet real, no solo su contenido de texto).

## 7. Hosting

- Despliegue en la nube, en **Vercel**.

## 8. Restricciones y preferencias del usuario

- El usuario no programa. La solución debe requerir el **mínimo mantenimiento técnico posible**
  una vez desplegada.
- Al finalizar la construcción, se debe explicar paso a paso cómo vincular OneDrive (registro de
  la aplicación en Azure AD, permisos de Microsoft Graph, consentimiento de administrador), en
  lenguaje simple y no técnico.

## 9. Fuera de alcance

- Edición de datos de ventas desde el panel (el panel es de solo lectura).
- Carga del Excel a OneDrive (responsabilidad del usuario, fuera del sistema).
- Login con cuenta Microsoft.
- Lectura del Excel en vivo desde el navegador.
