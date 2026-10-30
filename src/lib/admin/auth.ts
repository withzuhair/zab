import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import {
  getLoginThrottleKeys,
  isLoginThrottled,
  recordLoginFailure,
} from "@/lib/admin/login-throttle";

let dummyPasswordHash: Promise<string> | undefined;

function getDummyPasswordHash() {
  dummyPasswordHash ??= bcrypt.hash("unmatched-account-password", 12);
  return dummyPasswordHash;
}

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_URL) {
  throw new Error(
    "NEXTAUTH_URL must be configured for production admin sign-in.",
  );
}

function getClientIp(headers?: Record<string, string | string[] | undefined>) {
  if (!headers) return "unknown";
  const realIp = headers["x-real-ip"];
  const forwardedFor = headers["x-forwarded-for"];
  const firstForwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];
  const ip = Array.isArray(realIp) ? realIp[0] : realIp;

  return ip?.trim() || firstForwardedIp?.trim() || "unknown";
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Admin credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email?.trim().toLowerCase() ?? "";
        const password = credentials?.password ?? "";
        const ip = getClientIp(request.headers);
        const keys = getLoginThrottleKeys(ip, email || "invalid");

        if (await isLoginThrottled(keys)) {
          return null;
        }

        if (
          !email ||
          email.length > 254 ||
          !password ||
          password.length > 128
        ) {
          await recordLoginFailure(keys);
          return null;
        }

        const user = await prisma.adminUser.findUnique({
          where: { email },
        });
        const passwordHash =
          user?.passwordHash ?? (await getDummyPasswordHash());
        const passwordMatches = await bcrypt.compare(password, passwordHash);

        if (!user || !user.active || !passwordMatches) {
          await recordLoginFailure(keys);
          return null;
        }

        const signedInUser = await prisma.adminUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
          select: { passwordVersion: true },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          passwordVersion: signedInUser.passwordVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.passwordVersion = user.passwordVersion;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.passwordVersion = token.passwordVersion;
      }

      return session;
    },
  },
};

export async function getActiveAdmin() {
  await connection();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.adminUser.findFirst({
    where: { id: session.user.id, active: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      passwordVersion: true,
      mustChangePassword: true,
    },
  });

  if (!user || user.passwordVersion !== session.user.passwordVersion) {
    return null;
  }

  return user;
}

export async function requireAdmin() {
  const user = await getActiveAdmin();

  if (!user) {
    throw new Error("You must be signed in to access the admin panel.");
  }

  if (user.mustChangePassword) {
    throw new Error(
      "You must change your password before using the admin panel.",
    );
  }

  return user;
}

export async function requireRole(role: "ADMIN" | "STAFF") {
  const user = await requireAdmin();

  if (user.role !== role && user.role !== "ADMIN") {
    throw new Error("You do not have permission to perform this action.");
  }

  return user;
}
