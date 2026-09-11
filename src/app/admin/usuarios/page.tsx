import { prisma } from "@/lib/prisma";
import { UserForm } from "./UserForm";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold text-black">Usuarios del equipo</h1>

      <UserForm />

      <div className="rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-3">Usuario</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Creado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 last:border-0">
                <td className="p-3">{user.username}</td>
                <td className="p-3">{user.role === "ADMIN" ? "Administrador" : "Miembro"}</td>
                <td className="p-3">{user.createdAt.toLocaleDateString("es-CL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
