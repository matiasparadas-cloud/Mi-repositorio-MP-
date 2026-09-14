# Paleta de colores — decisión y contraste

- **Fecha:** 2026-09-14
- **Origen:** captura de pantalla de un botón "Suscribirse" de www.allnutrition.cl
  que el usuario compartió (no se pudo inspeccionar el sitio en vivo — el dominio
  está bloqueado por la política de red de este entorno, tanto por `curl` como por
  la herramienta de fetch web).

## Naranjo de marca

El botón de la captura es un naranjo/ámbar brillante. Se aproximó al step 500 de
la escala estándar Material Design "Orange" (`#FF9800`), que visualmente coincide
y además viene con una escala completa ya balanceada (50–900).

| Token | Hex | Contraste vs blanco | Uso |
|---|---|---|---|
| `brand-50`…`brand-300` | `#FFF3E0`…`#FFB74D` | — | fondos de chips/hover, nunca con texto encima |
| `brand-500` | `#FF9800` | 2.16:1 | color "verdadero" de marca: íconos, relleno de barras (con etiqueta de valor directa), barra activa de tabs |
| `brand-800` | `#EF6C00` | 3.08:1 | fondo de botones primarios (texto blanco en negrita ≥16px — cumple el umbral de 3:1 para texto grande/componentes UI) |
| `brand-900` | `#E65100` | 3.79:1 | estado presionado/activo de botones |
| `brand-text` | `#BF360C` | 5.60:1 | el único tono aprobado para texto naranjo directo sobre blanco (links, texto pequeño) — cumple AA 4.5:1 |

**Por qué no se usa `brand-500` para texto o fondos de botón:** un naranjo/ámbar
brillante como este nunca alcanza 4.5:1 contra blanco puro (es una limitación
física del propio tono, no un error de cálculo — se verificó con la función
`contrast()` del validador de paletas). Usarlo igual en botones con texto
pequeño sería una barrera de accesibilidad real para el equipo. La solución
estándar (la que usan Material Design, Tailwind, etc.) es la misma que se aplicó
acá: reservar el tono más vibrante para acentos con "canal de alivio" (ícono +
etiqueta, o una etiqueta de valor visible junto a la barra del gráfico), y usar
un paso más oscuro de la misma familia donde el contraste de texto importa.

## Estados (crecimiento YoY/WoW)

Colores fijos, no se retemizan por marca (siguiendo la guía de dataviz interna):

| Estado | Hex | Uso |
|---|---|---|
| `status-good` | `#0ca30c` | crecimiento positivo |
| `status-critical` | `#d03b3b` | crecimiento negativo |
| `status-warning` | `#fab219` | (reservado, sin uso actual) |
| `status-serious` | `#ec835a` | (reservado, sin uso actual) |

Siempre van acompañados de una flecha/ícono + el número, nunca solo el color
(un usuario con daltonismo debe poder distinguir "subió" de "bajó" sin depender
del color).

## Si el naranjo real difiere

Si al comparar el panel desplegado contra el sitio real el tono no coincide
exactamente, alcanza con reemplazar los 11 valores de `brand` en
`tailwind.config.ts` — ningún otro archivo depende de los hex directamente.
