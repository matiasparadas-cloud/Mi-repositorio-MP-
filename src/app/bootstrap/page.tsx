"use client";

import { useState, type FormEvent } from "react";

export default function BootstrapPage() {
  const [secret, setSecret] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/bootstrap", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, username, password }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "No se pudo crear el usuario.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="max-w-sm space-y-2 text-center">
          <h1 className="text-xl font-semibold text-black">Listo</h1>
          <p className="text-gray-600">
            Tu cuenta de administrador quedó creada. Ya podés{" "}
            <a href="/login" className="text-brand-text underline">
              iniciar sesión
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 p-6">
        <div>
          <h1 className="text-xl font-semibold text-black">Configuración inicial</h1>
          <p className="mt-1 text-sm text-gray-500">
            Esta pantalla solo funciona una vez, para crear la primera cuenta de administrador.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="secret" className="block text-sm font-medium text-gray-700">
            Código de configuración
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

        <div className="space-y-1">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Tu usuario
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Tu clave (mínimo 8 caracteres)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-brand-800 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Creando..." : "Crear mi cuenta"}
        </button>
      </form>
    </main>
  );
}
