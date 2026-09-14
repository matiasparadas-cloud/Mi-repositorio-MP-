# Desplegar el panel en Vercel

Esta guía cubre la puesta en producción: crear el proyecto en Vercel, la base
de datos, cargar las variables de entorno, y crear tu primera cuenta.

## 1. Crear la base de datos

1. Andá a **[vercel.com](https://vercel.com)** e iniciá sesión (o creá una
   cuenta, se puede hacer con GitHub directamente).
2. En el dashboard de Vercel, andá a la pestaña **"Storage"**.
3. Hacé clic en **"Create Database"** → elegí **"Postgres"** (es la opción
   con Neon por debajo — no hace falta crear una cuenta aparte en Neon).
4. Ponele un nombre (ej. `bi-ventas-db`) y confirmá la región más cercana a
   Chile disponible.
5. Todavía no hace falta conectarla a ningún proyecto — eso lo hacemos en el
   paso siguiente.

## 2. Importar el proyecto desde GitHub

1. En el dashboard de Vercel, hacé clic en **"Add New..."** → **"Project"**.
2. Elegí **"Import Git Repository"** y buscá
   `matiasparadas-cloud/Mi-repositorio-MP-`. Si no aparece, hacé clic en
   **"Adjust GitHub App Permissions"** y dale acceso a ese repositorio.
3. En **"Configure Project"**:
   - **Framework Preset**: debería detectar **Next.js** solo.
   - **Root Directory**: dejalo en blanco (raíz del repo).
4. Antes de desplegar, andá a la sección **"Environment Variables"** en esta
   misma pantalla y cargá las siguientes (ver el detalle de cada una abajo).
5. Hacé clic en **"Deploy"**.

## 3. Variables de entorno

En **Project Settings → Environment Variables** (o en la pantalla de
configuración inicial del paso 2), cargá:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Se completa sola si conectaste la base del paso 1 al proyecto (Storage → tu base → "Connect Project"). Si no, pegá el connection string que te da Vercel/Neon. |
| `NEXTAUTH_SECRET` | Un valor aleatorio largo. Se puede generar en <https://generate-secret.vercel.app/32> y pegar el resultado. |
| `NEXTAUTH_URL` | La URL pública del proyecto, ej. `https://bi-ventas.vercel.app` (Vercel te la muestra después del primer deploy; se puede editar y volver a desplegar). |
| `CRON_SECRET` | Otro valor aleatorio largo (mismo generador de arriba). Vercel lo usa automáticamente para autorizar la sincronización diaria — no hace falta hacer nada más con este valor. |
| `ONEDRIVE_SHARE_URL` | El link que copiaste en `docs/superpowers/guides/onedrive-linking.md`. |
| `BOOTSTRAP_SECRET` | Otro valor aleatorio largo — se usa **una sola vez**, para crear tu cuenta (paso 5). Después lo podés borrar de Vercel. |

Después de cargarlas todas, si ya habías desplegado, andá a la pestaña
**"Deployments"**, abrí los tres puntitos del último deploy y elegí
**"Redeploy"** para que las tome.

## 4. Confirmar que el despliegue funcionó

1. En la pestaña **"Deployments"**, esperá a que el estado pase a
   **"Ready"** (tarda 1-2 minutos).
2. Al compilar, el sistema aplica automáticamente la estructura de la base de
   datos — no hace falta correr ningún comando a mano, ni ahora ni en el
   futuro cuando actualicemos el panel.
3. Hacé clic en el dominio (algo como `bi-ventas.vercel.app`) para abrir el
   panel. Deberías ver la pantalla de login.

## 5. Crear tu cuenta (una sola vez)

1. Andá a `https://tu-dominio.vercel.app/bootstrap`.
2. Completá:
   - **Código de configuración**: el valor que pusiste en `BOOTSTRAP_SECRET`.
   - **Tu usuario** y **tu clave**.
3. Hacé clic en **"Crear mi cuenta"**.
4. Esa pantalla deja de funcionar automáticamente apenas creás la primera
   cuenta — no hay riesgo de que alguien más la use después.
5. Iniciá sesión normalmente en `/login`. Desde ahí, si necesitás sumar al
   resto del equipo, lo hacés vos mismo en **"Usuarios"** (arriba a la
   derecha del panel), sin volver a tocar Vercel ni Azure.

## 6. Confirmar que la sincronización diaria está activa

1. En el proyecto de Vercel, andá a la pestaña **"Settings" → "Cron Jobs"**.
2. Deberías ver una entrada para `/api/sync`, corriendo todos los días a las
   09:00 UTC (~06:00 hora de Chile). Se puede cambiar el horario editando
   `vercel.json` en el repositorio si prefieren otra hora.
3. Para probarlo sin esperar al otro día, abrí en el navegador (reemplazando
   los valores reales):
   ```
   https://tu-dominio.vercel.app/api/sync?secret=EL_VALOR_QUE_PUSISTE_EN_CRON_SECRET
   ```
   Si todo salió bien, la página muestra un texto con `"status":"SUCCESS"` y
   la cantidad de filas procesadas. Si corrió bien, vas a ver las ventas del
   Excel reflejadas en el panel.

## Mantenimiento (lo único que vas a tener que volver a tocar)

- **Si movés o borrás el archivo Excel**: el link de OneDrive deja de
  funcionar — generá uno nuevo (`onedrive-linking.md`) y actualizá
  `ONEDRIVE_SHARE_URL` en Vercel.
- **Si sospechás que el link se filtró**: en OneDrive, dejá de compartir el
  archivo y volvé a compartirlo (genera un link nuevo), y actualizá
  `ONEDRIVE_SHARE_URL`.
- Todo lo demás (altas de usuarios, actualizaciones del panel, backups de la
  base de datos) no requiere ninguna acción tuya.
