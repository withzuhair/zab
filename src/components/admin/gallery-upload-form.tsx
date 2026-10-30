"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type UploadResponse = { error?: string; item?: { title: string } };

export function GalleryUploadForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsUploading(true);
    const form = event.currentTarget;

    try {
      const response = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        body: new FormData(form),
      });
      const result = (await response.json()) as UploadResponse;

      if (!response.ok) {
        setError(result.error ?? "The image upload failed.");
        return;
      }

      form.reset();
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `The image upload failed: ${caught.message}`
          : "The image upload failed for an unknown reason.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section aria-labelledby="gallery-upload-heading" className="grid gap-4">
      <div>
        <h2 className="text-xl font-bold" id="gallery-upload-heading">
          Upload an image
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          JPEG, PNG, or WebP; up to 8 MB. New uploads stay unpublished until you
          confirm their details.
        </p>
      </div>
      <form
        className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-1 text-sm font-semibold">
          Image file
          <input
            accept="image/jpeg,image/png,image/webp"
            className="min-h-11 rounded-lg border p-2 font-normal"
            name="file"
            required
            type="file"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Title
          <input
            className="min-h-11 rounded-lg border px-3 font-normal"
            maxLength={150}
            minLength={2}
            name="title"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Alternative text
          <input
            className="min-h-11 rounded-lg border px-3 font-normal"
            maxLength={250}
            minLength={2}
            name="alt"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Category
          <select
            className="min-h-11 rounded-lg border bg-white px-3 font-normal"
            defaultValue="OTHER"
            name="category"
          >
            <option value="OCEAN">OCEAN</option>
            <option value="AIR">AIR</option>
            <option value="WAREHOUSE">WAREHOUSE</option>
            <option value="ROAD">ROAD</option>
            <option value="OTHER">OTHER</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
          Caption
          <textarea
            className="min-h-20 rounded-lg border p-3 font-normal"
            maxLength={500}
            name="caption"
          />
        </label>
        {error && (
          <p
            className="text-sm font-semibold text-red-800 sm:col-span-2"
            role="alert"
          >
            {error}
          </p>
        )}
        <button
          className="min-h-11 w-fit rounded-lg bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
          disabled={isUploading}
          type="submit"
        >
          {isUploading ? "Uploading…" : "Upload image"}
        </button>
      </form>
    </section>
  );
}
