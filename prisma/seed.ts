import { createUser } from "../src/lib/users";
import { prisma } from "../src/lib/prisma";

/**
 * Bootstrap de la primera cuenta ADMIN. Se corre una sola vez (`npx prisma db seed`),
 * normalmente durante el despliegue inicial (Tarea 8) — después de eso, todo alta de
 * usuario se hace desde /admin/usuarios, sin volver a tocar la terminal.
 */
async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.log(
      "ADMIN_USERNAME / ADMIN_PASSWORD no están definidos — no se crea ningún usuario. " +
        "Definilos como variables de entorno antes de correr `npx prisma db seed` la primera vez."
    );
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`El usuario "${username}" ya existe — no se hace nada.`);
    return;
  }

  await createUser({ username, password, role: "ADMIN" });
  console.log(`Usuario admin "${username}" creado correctamente.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
