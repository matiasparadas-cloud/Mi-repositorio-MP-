# Cómo vincular tu OneDrive al panel

Esta guía te lleva paso a paso por lo único que **solo vos podés hacer** (necesita
tu cuenta de Microsoft 365 con permisos de administrador). No hace falta saber
programar — son clics en dos páginas web: el portal de Azure y, al final, una
pantalla del propio panel.

En total vas a terminar con **5 datos** que me vas a pasar (o vas a cargar vos
mismo en Vercel, como prefieras — ver Tarea de despliegue). Los voy anotando en
un cuadro al final de cada sección para que no se pierdan.

---

## Por qué hace falta esto

El panel necesita bajar tu Excel de ventas desde OneDrive todos los días, sin que
nadie tenga que "iniciar sesión" a mano cada vez. Para eso, Microsoft pide que
registres una aplicación (un "permiso de robot", en criollo) una única vez, le
des permiso para leer archivos, y con eso el sistema queda andando solo.

---

## Parte 1 — Registrar la aplicación en Azure

1. Andá a **[portal.azure.com](https://portal.azure.com)** e iniciá sesión con tu
   cuenta de Microsoft 365 (la misma con la que administrás el correo/OneDrive
   del equipo).
2. En el buscador de arriba (la barra con la lupa, en el centro), escribí
   **"Microsoft Entra ID"** y hacé clic en el resultado. (Es el nuevo nombre de
   lo que antes se llamaba "Azure Active Directory" — si ves ese nombre en vez
   del otro, es lo mismo, seguí igual.)
3. En el menú de la izquierda, buscá y hacé clic en **"App registrations"**
   ("Registros de aplicaciones").
4. Arriba a la izquierda, hacé clic en **"+ New registration"**
   ("+ Nuevo registro").
5. Completá el formulario:
   - **Name**: escribí algo como `BI Ventas - Sincronización`.
   - **Supported account types**: dejá marcada la primera opción
     ("Accounts in this organizational directory only" — es la que dice que
     esta app es solo para tu organización).
   - **Redirect URI**: dejalo **vacío**, no hace falta tocarlo.
6. Hacé clic en **"Register"** ("Registrar") al final de la página.
7. Vas a caer en la página **"Overview"** de la app recién creada. Ahí vas a ver
   dos códigos largos — copialos a algún lado (un bloc de notas, por ejemplo):
   - **Application (client) ID**
   - **Directory (tenant) ID**

   | Dato | Dónde lo copiaste | Variable |
   |---|---|---|
   | Application (client) ID | Overview de la app | `MS_CLIENT_ID` |
   | Directory (tenant) ID | Overview de la app | `MS_TENANT_ID` |

## Parte 2 — Crear la clave secreta

1. En el menú de la izquierda de la misma app, hacé clic en
   **"Certificates & secrets"**.
2. Hacé clic en la pestaña **"Client secrets"** y después en
   **"+ New client secret"**.
3. Ponele una descripción (ej. `secreto-sincronizacion`) y elegí una duración
   (te recomiendo **24 months**, la más larga disponible). Hacé clic en
   **"Add"**.
4. **Importante:** apenas se crea, vas a ver una columna **"Value"** con un
   código largo. **Copialo inmediatamente** — es la única vez que Azure te lo
   muestra completo; si cerrás la página sin copiarlo, tenés que crear uno
   nuevo.

   | Dato | Dónde lo copiaste | Variable |
   |---|---|---|
   | Value (no "Secret ID") | Certificates & secrets | `MS_CLIENT_SECRET` |

   ⚠️ Este código funciona como una contraseña. No lo compartas por WhatsApp,
   email, ni lo pegues en ningún lado público — pasámelo solo por acá o
   cargalo vos directo en Vercel (ver guía de despliegue).

   Como vence en 24 meses, es el único mantenimiento periódico real del
   sistema: cuando falte poco para esa fecha, Azure te va a avisar por correo
   y hay que repetir este paso (crear un secreto nuevo y actualizarlo en
   Vercel).

## Parte 3 — Darle permiso para leer archivos

1. En el menú de la izquierda, hacé clic en **"API permissions"**.
2. Hacé clic en **"+ Add a permission"**.
3. En la ventana que se abre, elegí **"Microsoft Graph"** (el ícono grande,
   arriba de todo).
4. Elegí **"Application permissions"** (no "Delegated permissions" — es
   importante, esta opción es la que permite que el sistema funcione solo,
   sin que nadie esté logueado).
5. En el buscador, escribí **"Files"** y marcá el casillero de
   **"Files.Read.All"**.
6. Hacé clic en **"Add permissions"** al final.
7. De vuelta en la lista de permisos, vas a ver una franja amarilla o un botón
   que dice **"Grant admin consent for [nombre de tu organización]"**. Hacé
   clic ahí y confirmá con **"Yes"**.
   - Esto requiere que tu cuenta sea administradora del Microsoft 365. Si no lo
     es, va a hacer falta que alguien con ese rol haga este único clic.
8. Confirmá que la columna **"Status"** de "Files.Read.All" quedó con un
   tilde verde que dice **"Granted for [tu organización]"**. Si sigue diciendo
   "Not granted", repetí el paso 7.

## Parte 4 — Encontrar el Excel dentro de tu OneDrive

Ahora necesitamos que el sistema sepa *exactamente* dónde está tu archivo. Para
esto usamos una herramienta de Microsoft que no requiere instalar nada:

1. Andá a **[developer.microsoft.com/graph/graph-explorer](https://developer.microsoft.com/graph/graph-explorer)**.
2. Arriba a la derecha, hacé clic en **"Sign in"** e iniciá sesión con tu cuenta
   de Microsoft 365 (la que tiene el Excel en su OneDrive).
3. En la barra central, donde dice `GET` seguido de una URL, borrá lo que haya y
   pegá:
   ```
   https://graph.microsoft.com/v1.0/me/drive
   ```
   Hacé clic en **"Run query"**.
4. En el resultado (abajo), buscá el campo `"id"` cerca del principio — ese
   código largo es el **driveId**.

   | Dato | Variable |
   |---|---|
   | `id` de la respuesta | `MS_DRIVE_ID` |

5. Ahora, en la misma barra, reemplazá la URL por esta (cambiando
   `NombreDeTuArchivo.xlsx` por el nombre real, y `Ventas` por la carpeta donde
   esté si corresponde — si está directo en la raíz de OneDrive, sacá esa
   parte):
   ```
   https://graph.microsoft.com/v1.0/me/drive/root:/Ventas/NombreDeTuArchivo.xlsx
   ```
   Hacé clic en **"Run query"** de nuevo.
   - Si no sabés la ruta exacta, podés buscarlo por nombre en cambio:
     ```
     https://graph.microsoft.com/v1.0/me/drive/root/search(q='NombreDeTuArchivo.xlsx')
     ```
6. En el resultado, buscá de nuevo el campo `"id"` (esta vez es el id del
   archivo, no del drive).

   | Dato | Variable |
   |---|---|
   | `id` del archivo | `MS_EXCEL_ITEM_ID` |

## Resumen: lo que me pasás (o cargás vos en Vercel)

Al terminar, deberías tener estos 5 valores:

- `MS_TENANT_ID`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `MS_DRIVE_ID`
- `MS_EXCEL_ITEM_ID`

Estos van como variables de entorno en Vercel (ver
`docs/superpowers/guides/vercel-deployment.md`). Una vez cargados, el sistema
va a poder descargar tu Excel todos los días sin que vuelvas a tocar nada —
salvo la renovación del secreto cada 24 meses (Parte 2).
