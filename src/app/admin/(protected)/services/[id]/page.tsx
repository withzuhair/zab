import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateService } from "@/app/admin/actions";
import { AdminLoading } from "@/components/admin/admin-loading";
import { prisma } from "@/lib/db";

type AdminServiceProps = { params: Promise<{ id: string }> };

export default function EditServicePage(props: AdminServiceProps) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditServiceContent {...props} />
    </Suspense>
  );
}

async function EditServiceContent({ params }: AdminServiceProps) {
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });

  if (!service) notFound();

  return (
    <div className="grid gap-6">
      <header>
        <Link
          className="text-sm font-semibold text-blue-700 underline underline-offset-4"
          href="/admin/services"
        >
          Back to services
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">Edit {service.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Public URL: /services/{service.slug}
        </p>
      </header>
      <form action={updateService} className="grid gap-4">
        <input name="id" type="hidden" value={service.id} />
        <label className="grid gap-1 text-sm font-semibold">
          Headline
          <input
            className="min-h-11 rounded-lg border px-3 font-normal"
            defaultValue={service.headline}
            maxLength={180}
            name="headline"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Summary
          <textarea
            className="min-h-24 rounded-lg border p-3 font-normal"
            defaultValue={service.summary}
            maxLength={500}
            name="summary"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Body (Markdown)
          <textarea
            className="min-h-72 rounded-lg border p-3 font-mono text-sm font-normal"
            defaultValue={service.body}
            maxLength={20_000}
            name="body"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Highlights (one per line)
          <textarea
            className="min-h-32 rounded-lg border p-3 font-normal"
            defaultValue={service.highlights.join("\n")}
            name="highlights"
          />
        </label>
        <label className="grid max-w-xs gap-1 text-sm font-semibold">
          Display order
          <input
            className="min-h-11 rounded-lg border px-3 font-normal"
            defaultValue={service.sortOrder}
            min={0}
            name="sortOrder"
            type="number"
          />
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
          <input
            defaultChecked={service.published}
            name="published"
            type="checkbox"
          />
          Published on the public site
        </label>
        <button
          className="min-h-11 w-fit rounded-lg bg-blue-700 px-5 font-bold text-white hover:bg-blue-800"
          type="submit"
        >
          Save service
        </button>
      </form>
    </div>
  );
}
