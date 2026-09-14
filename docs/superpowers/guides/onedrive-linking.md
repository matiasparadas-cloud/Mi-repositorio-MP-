# Cómo vincular tu OneDrive al panel

Esta guía te lleva por lo único que **solo vos podés hacer**. Es un paso simple
en OneDrive — nada de portales técnicos, ni cuentas nuevas, ni permisos de
administrador.

## Cómo funciona (y qué implica)

El panel necesita bajar tu Excel de ventas todos los días. Para eso, compartís
el archivo con un link de descarga directa y ese link queda configurado en el
sistema — sin que nadie tenga que iniciar sesión.

⚠️ **Importante, antes de seguir:** elegiste esta forma (en vez de la
alternativa con Microsoft Azure) para no tener que registrar una aplicación
ni pedir permisos de administrador. La contrapartida es que **el link
funciona como una clave**: cualquier persona que lo consiga —por error, por un
reenvío sin querer, por quedar guardado en un chat— puede descargar tu Excel
de ventas (precios, márgenes, etc.) sin loguearse en nada. Tratalo con el
mismo cuidado que una contraseña: no lo pegues en chats grupales, no lo
mandes por WhatsApp a la ligera, y si alguna vez sospechás que se filtró,
generá un link nuevo (paso 5) y actualizalo en Vercel.

## Pasos

1. Abrí **OneDrive** (o Excel Online) y ubicá el archivo de ventas.
2. Hacé clic derecho sobre el archivo → **"Compartir"** (o el botón
   **"Compartir"** si lo tenés abierto).
3. En la ventana que se abre, hacé clic donde dice algo como
   **"Personas de [tu organización] con el link pueden ver"** (el texto exacto
   varía un poco) para cambiar la configuración del link.
4. Elegí la opción **"Cualquiera con el link"** (a veces aparece como
   "Anyone with the link"). Dejá el permiso en **"Puede ver"** (no
   "Puede editar" — el panel solo necesita leerlo).
5. Hacé clic en **"Copiar link"** (o **"Aplicar"** y después **"Copiar"**,
   según la versión). Vas a terminar con una dirección larga que arranca
   parecido a `https://tuempresa-my.sharepoint.com/:x:/g/personal/...`.
6. Guardá ese link — es el único dato que necesitás pasarme (o cargar vos
   mismo como `ONEDRIVE_SHARE_URL` en Vercel, ver
   `docs/superpowers/guides/vercel-deployment.md`).

## Confirmar que funciona

Antes de darlo por terminado, probamos que el link realmente descarga el
archivo sin pedir login: pegá el link en una ventana de navegador **en modo
incógnito/privado** (para asegurarte de que no estás aprovechando que ya
tenés la sesión de Microsoft abierta) y confirmá que el archivo se abre o
descarga sin pedirte iniciar sesión. Si te pide login, revisá el paso 4 —
probablemente quedó en "Personas de la organización" en vez de "Cualquiera
con el link".

## Si el archivo cambia de nombre o ubicación

No hace falta rehacer nada de esto: mientras el archivo exista en esa
ubicación y con el mismo link, el sistema lo sigue encontrando. Si lo **movés
o lo borrás y creás uno nuevo**, el link deja de funcionar — repetí los pasos
2 a 6 con el archivo nuevo y pasame el link actualizado.
