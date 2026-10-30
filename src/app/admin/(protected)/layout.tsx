import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getActiveAdmin } from "@/lib/admin/auth";

export default function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main className="p-8" role="status">
          Loading admin panel…
        </main>
      }
    >
      <ProtectedAdminContent>{children}</ProtectedAdminContent>
    </Suspense>
  );
}

async function ProtectedAdminContent({ children }: { children: ReactNode }) {
  const user = await getActiveAdmin();

  if (!user) {
    redirect("/admin/login");
  }

  if (user.mustChangePassword) {
    redirect("/admin/change-password");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
