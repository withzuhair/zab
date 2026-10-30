import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MandatoryPasswordChangeForm } from "@/components/admin/mandatory-password-change-form";
import { getActiveAdmin } from "@/lib/admin/auth";

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8" role="status">
          Loading password settings…
        </main>
      }
    >
      <ChangePasswordContent />
    </Suspense>
  );
}

async function ChangePasswordContent() {
  const user = await getActiveAdmin();
  if (!user) {
    redirect("/admin/login");
  }
  if (!user.mustChangePassword) {
    redirect("/admin");
  }

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
        <h1 className="mt-2 text-3xl font-extrabold">Change your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Set a new password before continuing to the admin panel.
        </p>
        <MandatoryPasswordChangeForm />
      </div>
    </main>
  );
}
