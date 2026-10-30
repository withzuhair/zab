import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { updateEnquiry } from "@/app/admin/actions";
import { prisma } from "@/lib/db";

type EnquiryDetailProps = { params: Promise<{ id: string }> };

const statuses = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST", "SPAM"];

export default function EnquiryDetailPage(props: EnquiryDetailProps) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EnquiryDetailContent {...props} />
    </Suspense>
  );
}

async function EnquiryDetailContent({ params }: EnquiryDetailProps) {
  const { id } = await params;
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });

  if (!enquiry) notFound();

  const replySubject = encodeURIComponent(
    `Re: ZAB Shipping enquiry ${enquiry.id}`,
  );

  return (
    <div className="grid gap-6">
      <header>
        <Link
          className="text-sm font-semibold text-blue-700 underline underline-offset-4"
          href="/admin/enquiries"
        >
          Back to enquiries
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">{enquiry.fullName}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Received {enquiry.createdAt.toLocaleString()}
        </p>
      </header>

      <section
        aria-label="Enquiry details"
        className="grid gap-4 sm:grid-cols-2"
      >
        <Detail label="Email">
          <a
            className="text-blue-800 underline underline-offset-4"
            href={`mailto:${enquiry.email}?subject=${replySubject}`}
          >
            {enquiry.email}
          </a>
        </Detail>
        <Detail label="Phone">{enquiry.phone || "Not provided"}</Detail>
        <Detail label="Company">{enquiry.company || "Not provided"}</Detail>
        <Detail label="Service">{enquiry.serviceType}</Detail>
        <Detail label="Route">
          {[enquiry.origin, enquiry.destination].filter(Boolean).join(" → ") ||
            "Not provided"}
        </Detail>
        <Detail label="Cargo">
          {[enquiry.cargoType, enquiry.weightVolume]
            .filter(Boolean)
            .join(" · ") || "Not provided"}
        </Detail>
      </section>

      <section aria-labelledby="message-heading">
        <h2 className="text-lg font-bold" id="message-heading">
          Customer message
        </h2>
        <p className="mt-2 rounded-xl border bg-slate-50 p-4 leading-7 whitespace-pre-wrap">
          {enquiry.message}
        </p>
      </section>

      <form action={updateEnquiry} className="grid gap-4 border-t pt-5">
        <input name="id" type="hidden" value={enquiry.id} />
        <label className="grid max-w-sm gap-1 text-sm font-semibold">
          Status
          <select
            className="min-h-11 rounded-lg border bg-white px-3 font-normal"
            defaultValue={enquiry.status}
            name="status"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Internal notes
          <textarea
            className="min-h-32 rounded-lg border bg-white p-3 font-normal"
            defaultValue={enquiry.internalNotes ?? ""}
            maxLength={5000}
            name="internalNotes"
          />
        </label>
        <button
          className="min-h-11 w-fit rounded-lg bg-blue-700 px-5 font-bold text-white hover:bg-blue-800"
          type="submit"
        >
          Save enquiry
        </button>
      </form>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-wide text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
  );
}
