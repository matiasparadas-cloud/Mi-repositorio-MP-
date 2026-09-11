import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: "ADMIN" | "MEMBER";
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<AuthenticatedUser | null> {
  if (!username || !password) return null;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) return null;

  return { id: user.id, username: user.username, role: user.role };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Clave", type: "password" },
      },
      async authorize(credentials) {
        const user = await verifyCredentials(credentials?.username ?? "", credentials?.password ?? "");
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as AuthenticatedUser).id;
        token.role = (user as AuthenticatedUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as AuthenticatedUser).id = token.id as string;
        (session.user as AuthenticatedUser).role = token.role as "ADMIN" | "MEMBER";
      }
      return session;
    },
  },
};
