import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts"],
    // Varias suites son tests de integración contra la misma Postgres de test
    // (mismos datos de fixture, ej. username "juan"). Correr archivos en
    // paralelo genera condiciones de carrera entre suites independientes.
    fileParallelism: false,
  },
});
