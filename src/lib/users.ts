import bcrypt from "bcryptjs";
import { Prisma, type User, type UserRole } from "@prisma/client";
import { prisma } from "./prisma";

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export interface CreateUserInput {
  username: string;
  password: string;
  role?: UserRole;
}

export async function createUser({ username, password, role = "MEMBER" }: CreateUserInput): Promise<User> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`La clave debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    return await prisma.user.create({ data: { username, passwordHash, role } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error(`El usuario "${username}" ya existe.`);
    }
    throw error;
  }
}
