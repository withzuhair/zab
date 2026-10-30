import Image from "next/image";
import { Suspense } from "react";
import {
  deleteGalleryItem,
  moveGalleryItem,
  updateGalleryItem,
} from "@/app/admin/actions";
import { AdminLoading } from "@/components/admin/admin-loading";
import { GalleryUploadForm } from "@/components/admin/gallery-upload-form";
import { prisma } from "@/lib/db";

const categories = ["OCEAN", "AIR", "WAREHOUSE", "ROAD", "OTHER"];

export default function AdminGalleryPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminGalleryContent />
    </Suspense>
  );
}

async function AdminGalleryContent() {
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
          Website content
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Gallery</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Upload, edit, publish, reorder, and remove gallery images.
        </p>
      </header>
      <GalleryUploadForm />
      <div className="grid gap-5">
        {items.map((item, index) => (
          <article
            className="grid gap-4 rounded-xl border p-4 md:grid-cols-[180px_1fr]"
            key={item.id}
          >
            <Image
              alt={item.alt}
              className="aspect-[3/2] w-full rounded-lg object-cover"
              height={360}
              placeholder={item.blurDataUrl ? "blur" : "empty"}
              blurDataURL={item.blurDataUrl ?? undefined}
              src={item.imageUrl}
              unoptimized
              width={540}
            />
            <div className="grid gap-4">
              <form
                action={updateGalleryItem}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input name="id" type="hidden" value={item.id} />
                <label className="grid gap-1 text-sm font-semibold">
                  Title
                  <input
                    className="min-h-10 rounded-lg border px-3 font-normal"
                    defaultValue={item.title}
                    maxLength={150}
                    name="title"
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Category
                  <select
                    className="min-h-10 rounded-lg border bg-white px-3 font-normal"
                    defaultValue={item.category}
                    name="category"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
                  Caption
                  <textarea
                    className="min-h-16 rounded-lg border p-3 font-normal"
                    defaultValue={item.caption ?? ""}
                    maxLength={500}
                    name="caption"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
                  Alternative text
                  <input
                    className="min-h-10 rounded-lg border px-3 font-normal"
                    defaultValue={item.alt}
                    maxLength={250}
                    name="alt"
                    required
                  />
                </label>
                <label className="grid max-w-xs gap-1 text-sm font-semibold">
                  Display order
                  <input
                    className="min-h-10 rounded-lg border px-3 font-normal"
                    defaultValue={item.sortOrder}
                    min={0}
                    name="sortOrder"
                    type="number"
                  />
                </label>
                <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
                  <input
                    defaultChecked={item.published}
                    name="published"
                    type="checkbox"
                  />
                  Published
                </label>
                <button
                  className="min-h-10 w-fit rounded-lg bg-blue-700 px-4 font-bold text-white hover:bg-blue-800"
                  type="submit"
                >
                  Save item
                </button>
              </form>
              <div aria-label={`Reorder ${item.title}`} className="flex gap-2">
                <form action={moveGalleryItem}>
                  <input name="id" type="hidden" value={item.id} />
                  <input name="direction" type="hidden" value="up" />
                  <button
                    aria-label={`Move ${item.title} up`}
                    className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                    disabled={index === 0}
                    type="submit"
                  >
                    Move up
                  </button>
                </form>
                <form action={moveGalleryItem}>
                  <input name="id" type="hidden" value={item.id} />
                  <input name="direction" type="hidden" value="down" />
                  <button
                    aria-label={`Move ${item.title} down`}
                    className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                    disabled={index === items.length - 1}
                    type="submit"
                  >
                    Move down
                  </button>
                </form>
              </div>
              <form action={deleteGalleryItem}>
                <input name="id" type="hidden" value={item.id} />
                <button
                  className="min-h-10 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-800 hover:bg-red-50"
                  type="submit"
                >
                  Delete item
                </button>
              </form>
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <p className="rounded-xl border p-5 text-slate-600">
            No gallery items are in the database yet.
          </p>
        )}
      </div>
    </div>
  );
}
