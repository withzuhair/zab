import Link from "next/link";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { listEnquiries, parseEnquiryQuery } from "@/lib/admin/enquiry-query";

type EnquiriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const serviceOptions = [
  ["OCEAN", "Ocean freight"],
  ["AIR", "Air freight"],
  ["WAREHOUSING", "Warehousing"],
  ["CUSTOMS", "Customs"],
  ["RORO_PROJECT", "RORO / project cargo"],
  ["DANGEROUS_GOODS", "Dangerous goods"],
  ["NOT_SURE", "Not sure"],
] as const;

const statusOptions = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "WON",
  "LOST",
  "SPAM",
] as const;

export default function EnquiriesPage(props: EnquiriesPageProps) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EnquiriesPageContent {...props} />
    </Suspense>
  );
}

async function EnquiriesPageContent({ searchParams }: EnquiriesPageProps) {
  const params = await searchParams;
  const query = parseEnquiryQuery(params);
  const { items, total, pageSize } = await listEnquiries(query, {
    paginate: true,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
            Inbox
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Enquiries</h1>
          <p className="mt-2 text-sm text-slate-600">
            {total} matching records
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold hover:bg-slate-50"
          href={`/api/admin/enquiries/export?${new URLSearchParams({
            ...(query.q ? { q: query.q } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.service ? { service: query.service } : {}),
            sort: query.sort,
          }).toString()}`}
        >
          Export CSV
        </Link>
      </header>

      <form
        action="/admin/enquiries"
        className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5"
        method="get"
      >
        <label className="grid gap-1 text-sm font-semibold lg:col-span-2">
          Search
          <input
            className="min-h-10 rounded-lg border bg-white px-3 font-normal"
            defaultValue={query.q}
            maxLength={100}
            name="q"
            placeholder="Name, company or email"
            type="search"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Status
          <select
            className="min-h-10 rounded-lg border bg-white px-3 font-normal"
            defaultValue={query.status ?? ""}
            name="status"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Service
          <select
            className="min-h-10 rounded-lg border bg-white px-3 font-normal"
            defaultValue={query.service ?? ""}
            name="service"
          >
            <option value="">All services</option>
            {serviceOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <label className="grid flex-1 gap-1 text-sm font-semibold">
            Sort
            <select
              className="min-h-10 rounded-lg border bg-white px-3 font-normal"
              defaultValue={query.sort}
              name="sort"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <button
            className="min-h-10 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800"
            type="submit"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[740px] text-left text-sm">
          <thead>
            <tr className="border-b text-slate-600">
              <th className="py-2 pr-3">Name / company</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Service</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Received</th>
            </tr>
          </thead>
          <tbody>
            {items.map((enquiry) => (
              <tr className="border-b last:border-0" key={enquiry.id}>
                <td className="py-3 pr-3">
                  <Link
                    className="font-semibold text-blue-800 hover:underline"
                    href={`/admin/enquiries/${enquiry.id}`}
                  >
                    {enquiry.fullName}
                  </Link>
                  {enquiry.company && (
                    <span className="mt-1 block text-xs text-slate-600">
                      {enquiry.company}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3">{enquiry.email}</td>
                <td className="py-3 pr-3">{enquiry.serviceType}</td>
                <td className="py-3 pr-3">{enquiry.status}</td>
                <td className="py-3">
                  {enquiry.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="py-6 text-slate-600" colSpan={5}>
                  No enquiries match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Enquiry pages"
        className="flex items-center justify-between"
      >
        <p className="text-sm text-slate-600">
          Page {Math.min(query.page, totalPages)} of {totalPages}
        </p>
        <div className="flex gap-2">
          {query.page > 1 && (
            <PageLink params={params} page={query.page - 1}>
              Previous
            </PageLink>
          )}
          {query.page < totalPages && (
            <PageLink params={params} page={query.page + 1}>
              Next
            </PageLink>
          )}
        </div>
      </nav>
    </div>
  );
}

function PageLink({
  params,
  page,
  children,
}: {
  params: Record<string, string | string[] | undefined>;
  page: number;
  children: string;
}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) search.set(key, value);
  }
  search.set("page", String(page));

  return (
    <Link
      className="inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold hover:bg-slate-50"
      href={`/admin/enquiries?${search.toString()}`}
    >
      {children}
    </Link>
  );
}
