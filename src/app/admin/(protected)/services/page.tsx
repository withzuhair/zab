import Link from "next/link";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { prisma } from "@/lib/db";

export default function AdminServicesPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminServicesContent />
    </Suspense>
  );
}

async function AdminServicesContent() {
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      headline: true,
      slug: true,
      published: true,
      sortOrder: true,
    },
  });

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
          Website content
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Services</h1>
      </header>
      <div className="grid gap-3">
        {services.map((service) => (
          <article
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
            key={service.id}
          >
            <div>
              <h2 className="font-bold">{service.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{service.headline}</p>
              <p className="mt-1 text-xs text-slate-500">
                /services/{service.slug} · order {service.sortOrder} ·{" "}
                {service.published ? "Published" : "Draft"}
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50"
              href={`/admin/services/${service.id}`}
            >
              Edit service
            </Link>
          </article>
        ))}
        {services.length === 0 && (
          <p className="rounded-xl border p-5 text-slate-600">
            No services are in the database yet.
          </p>
        )}
      </div>
    </div>
  );
}
