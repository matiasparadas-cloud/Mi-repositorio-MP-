import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Naranjo de marca (tomado de allnutrition.cl), sobre base blanco/negro.
        // Ver docs/superpowers/design/color-palette.md para el detalle de contraste
        // y por qué cada paso se usa donde se usa.
        brand: {
          50: "#FFF3E0",
          100: "#FFE0B2",
          200: "#FFCC80",
          300: "#FFB74D",
          400: "#FFA726",
          500: "#FF9800",
          600: "#FB8C00",
          700: "#F57C00",
          800: "#EF6C00",
          900: "#E65100",
          text: "#BF360C",
        },
        // Estados fijos (crecimiento YoY/WoW) — nunca se retemizan por marca.
        status: {
          good: "#0ca30c",
          warning: "#fab219",
          serious: "#ec835a",
          critical: "#d03b3b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
