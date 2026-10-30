"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="hover:bg-muted min-h-10 rounded-lg border px-3 text-sm font-semibold"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      type="button"
    >
      Sign out
    </button>
  );
}
