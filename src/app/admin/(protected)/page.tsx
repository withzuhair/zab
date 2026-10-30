import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { prisma } from "@/lib/db";

const enquiryStatuses = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "WON",
  "LOST",
  "SPAM",
] as const;

function getWeekStart() {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + mondayOffset,
    ),
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

async function AdminDashboardContent() {
  await connection();
  const weekStart = getWeekStart();
  const [newCount, weekCount, groupedStatusCounts, recent] = await Promise.all([
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.enquiry.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.enquiry.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
    prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);
  const countByStatus = new Map(
    groupedStatusCounts.map(({ status, _count }) => [status, _count._all]),
  );
  const statusCounts = enquiryStatuses.map((status) => ({
    status,
    count: countByStatus.get(status) ?? 0,
  }));

  return (
    <div className="grid gap-8">
      <header>
        <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
          Workspace
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Dashboard</h1>
      </header>
      <section
        aria-label="Enquiry summary"
        className="grid gap-4 sm:grid-cols-2"
      >
        <SummaryCard label="New enquiries" value={newCount} />
        <SummaryCard label="Enquiries this week" value={weekCount} />
      </section>
      <section aria-labelledby="status-heading">
        <h2 className="text-xl font-bold" id="status-heading">
          Enquiry status
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {statusCounts.map(({ status, count }) => (
            <li
              className="rounded-full border bg-slate-50 px-3 py-1.5 text-sm"
              key={status}
            >
              {status}: {count}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="recent-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold" id="recent-heading">
            Recent enquiries
          </h2>
          <Link
            className="font-semibold text-blue-700 underline underline-offset-4"
            href="/admin/enquiries"
          >
            View all
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-600">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Received</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((enquiry) => (
                <tr className="border-b last:border-0" key={enquiry.id}>
                  <td className="py-3 pr-3">
                    <Link
                      className="font-semibold hover:underline"
                      href={`/admin/enquiries/${enquiry.id}`}
                    >
                      {enquiry.fullName}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">{enquiry.email}</td>
                  <td className="py-3 pr-3">{enquiry.status}</td>
                  <td className="py-3">
                    {enquiry.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td className="py-5 text-slate-600" colSpan={4}>
                    There are no enquiries to show.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border bg-slate-50 p-5">
      <h2 className="text-sm font-semibold text-slate-600">{label}</h2>
      <p className="mt-2 text-4xl font-extrabold tabular-nums">{value}</p>
    </article>
  );
}
