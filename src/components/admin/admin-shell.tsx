import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/admin/sign-out-button";

const navigation = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/gallery", label: "Gallery" },
] as const;

export function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; email: string; role: "ADMIN" | "STAFF" };
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <Link
              className="text-xl font-extrabold tracking-tight"
              href="/admin"
            >
              ZAB Shipping
              <span className="ml-2 text-sm font-medium text-slate-500">
                Admin
              </span>
            </Link>
            <p className="mt-1 text-xs text-slate-600">
              {user.name} · {user.role}
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[210px_1fr]">
        <nav
          aria-label="Admin navigation"
          className="flex flex-wrap gap-2 lg:block"
        >
          {navigation.map((item) => (
            <Link
              className="mb-1 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-white hover:text-slate-950 lg:flex"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          {user.role === "ADMIN" && (
            <>
              <Link
                className="mb-1 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-white hover:text-slate-950 lg:flex"
                href="/admin/settings"
              >
                Settings
              </Link>
              <Link
                className="mb-1 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-white hover:text-slate-950 lg:flex"
                href="/admin/users"
              >
                Users
              </Link>
            </>
          )}
          <Link
            className="mb-1 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-white hover:text-slate-950 lg:flex"
            href="/"
          >
            View website
          </Link>
        </nav>
        <main
          className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-7"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
