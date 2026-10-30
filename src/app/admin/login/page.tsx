import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getActiveAdmin } from "@/lib/admin/auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

type AdminLoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  return (
    <Suspense
      fallback={
        <main
          className="flex min-h-screen items-center justify-center"
          role="status"
        >
          Loading sign-in…
        </main>
      }
    >
      <AdminLoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminLoginContent({ searchParams }: AdminLoginPageProps) {
  if (await getActiveAdmin()) redirect("/admin");

  const params = await searchParams;
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : "/admin";
  const passwordChanged = params.passwordChanged === "1";

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12"
      id="main-content"
      tabIndex={-1}
    >
      <div className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-sm">
        <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
          ZAB Shipping
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in with your administrator or staff account.
        </p>
        {passwordChanged && (
          <p
            className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900"
            role="status"
          >
            Password updated. Sign in with your new password.
          </p>
        )}
        <AdminLoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
