"use client";

import { useState, type FormEvent } from "react";

export default function SeedDemoPage() {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ products: number; salespersons: number; zones: number; saleLines: number } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const response = await fetch("/api/dev/seed-demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "No se pudieron cargar los datos de ejemplo.");
      return;
    }

    setResult(await response.json());
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 p-6">
        <div>
          <h1 className="text-xl font-semibold text-black">Cargar datos de ejemplo</h1>
          <p className="mt-1 text-sm text-gray-500">
            Solo para explorar el panel con datos de prueba, antes de conectar tu Excel real. Se
            puede correr las veces que quieras — cada vez reemplaza los datos anteriores.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="secret" className="block text-sm font-medium text-gray-700">
            Código
          </label>
          <input
            id="secret"
            type="password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {result && (
          <p className="text-sm text-status-good">
            Listo: {result.saleLines} ventas de ejemplo cargadas. Andá al{" "}
            <a href="/" className="underline">
              panel
            </a>{" "}
            a verlas.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-brand-800 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Cargando..." : "Cargar datos de ejemplo"}
        </button>
      </form>
    </main>
  );
}
