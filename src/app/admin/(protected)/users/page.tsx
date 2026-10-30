import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  createAdminUser,
  resetAdminPassword,
  updateAdminUser,
} from "@/app/admin/actions";
import { AdminLoading } from "@/components/admin/admin-loading";
import { getActiveAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function AdminUsersPage(props: AdminUsersPageProps) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminUsersContent {...props} />
    </Suspense>
  );
}

async function AdminUsersContent({ searchParams }: AdminUsersPageProps) {
  const actor = await getActiveAdmin();
  if (!actor) redirect("/admin/login");
  if (actor.role !== "ADMIN") redirect("/admin");

  const [users, params] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    searchParams,
  ]);
  const notice = typeof params.created === "string" ? "User created." : "";
  const statusNotice =
    typeof params.updated === "string" ? "User access updated." : notice;
  const passwordNotice =
    typeof params.passwordReset === "string" ? "Password reset." : statusNotice;

  return (
    <div className="grid gap-8">
      <header>
        <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Admin users</h1>
      </header>
      {passwordNotice && (
        <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          {passwordNotice}
        </p>
      )}

      <section className="grid gap-4 border-b pb-7" aria-labelledby="add-user">
        <h2 className="text-xl font-bold" id="add-user">
          Create user
        </h2>
        <form action={createAdminUser} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Name
            <input
              className="min-h-11 rounded-lg border px-3 font-normal"
              maxLength={100}
              minLength={2}
              name="name"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Email
            <input
              className="min-h-11 rounded-lg border px-3 font-normal"
              maxLength={254}
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Temporary password (12 characters minimum)
            <input
              autoComplete="new-password"
              className="min-h-11 rounded-lg border px-3 font-normal"
              maxLength={128}
              minLength={12}
              name="password"
              required
              type="password"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Role
            <select
              className="min-h-11 rounded-lg border bg-white px-3 font-normal"
              defaultValue="STAFF"
              name="role"
            >
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <button
            className="min-h-11 w-fit rounded-lg bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 sm:col-span-2"
            type="submit"
          >
            Create user
          </button>
        </form>
      </section>

      <section className="grid gap-4" aria-labelledby="existing-users">
        <h2 className="text-xl font-bold" id="existing-users">
          Existing users
        </h2>
        {users.map((user) => (
          <article className="grid gap-4 rounded-xl border p-4" key={user.id}>
            <div>
              <h3 className="font-bold">{user.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>
              <p className="mt-1 text-xs text-slate-500">
                {user.active ? "Active" : "Deactivated"} · Last login:{" "}
                {user.lastLoginAt?.toLocaleString() ?? "Never"}
              </p>
            </div>
            <form
              action={updateAdminUser}
              className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
            >
              <input name="id" type="hidden" value={user.id} />
              <label className="grid gap-1 text-sm font-semibold">
                Role
                <select
                  className="min-h-10 rounded-lg border bg-white px-3 font-normal"
                  defaultValue={user.role}
                  name="role"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label className="flex min-h-10 items-center gap-2 self-end text-sm font-semibold">
                <input
                  defaultChecked={user.active}
                  name="active"
                  type="checkbox"
                />
                Active
              </label>
              <button
                className="min-h-10 self-end rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50"
                type="submit"
              >
                Save access
              </button>
            </form>
            <form
              action={resetAdminPassword}
              className="grid gap-3 border-t pt-3 sm:grid-cols-[1fr_auto]"
            >
              <input name="id" type="hidden" value={user.id} />
              <label className="grid gap-1 text-sm font-semibold">
                Set new password (12 characters minimum)
                <input
                  autoComplete="new-password"
                  className="min-h-10 rounded-lg border px-3 font-normal"
                  maxLength={128}
                  minLength={12}
                  name="password"
                  required
                  type="password"
                />
              </label>
              <button
                className="min-h-10 self-end rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50"
                type="submit"
              >
                Reset password
              </button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
