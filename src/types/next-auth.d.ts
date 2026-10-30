import type { DefaultSession } from "next-auth";

type AdminRole = "ADMIN" | "STAFF";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AdminRole;
      passwordVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: AdminRole;
    passwordVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AdminRole;
    passwordVersion: number;
  }
}
