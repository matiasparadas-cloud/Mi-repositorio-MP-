"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function UserForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "No se pudo crear el usuario.");
      return;
    }

    setUsername("");
    setPassword("");
    setRole("MEMBER");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4">
      <h2 className="font-medium text-black">Crear usuario nuevo</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="new-username" className="text-sm text-gray-700">
          Usuario
        </label>
        <input
          id="new-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="new-password" className="text-sm text-gray-700">
          Clave (mínimo 8 caracteres)
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="new-role" className="text-sm text-gray-700">
          Rol
        </label>
        <select
          id="new-role"
          value={role}
          onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="MEMBER">Miembro (solo ve el panel)</option>
          <option value="ADMIN">Administrador (puede crear usuarios)</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}
