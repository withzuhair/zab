import { randomUUID } from "node:crypto";
import { z } from "zod";
import { writeAuditLog } from "@/lib/admin/audit";
import { getActiveAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import {
  InvalidImageError,
  MAX_IMAGE_BYTES,
  normalizeImage,
} from "@/lib/media/normalize-image";
import { getStorageDriver } from "@/lib/storage";
import type { StorageDriver } from "@/lib/storage";

const requestOverheadBytes = 128 * 1024;
const uploadMetadataSchema = z.object({
  title: z.string().trim().min(2).max(150),
  alt: z.string().trim().min(2).max(250),
  caption: z.string().trim().max(500),
  category: z.enum(["OCEAN", "AIR", "WAREHOUSE", "ROAD", "OTHER"]),
});

export async function POST(request: Request) {
  const actor = await getActiveAdmin();
  if (!actor) {
    return Response.json(
      { error: "Admin sign-in is required." },
      { status: 401 },
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength === null || !/^\d+$/.test(contentLength)) {
    return Response.json(
      { error: "The upload request must include a valid content length." },
      { status: 411 },
    );
  }
  if (Number(contentLength) > MAX_IMAGE_BYTES + requestOverheadBytes) {
    return Response.json(
      { error: "Image files must be 8 MB or smaller." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Could not parse gallery upload request.", error);
    return Response.json(
      { error: "The upload request could not be read." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: "Choose an image file to upload." },
      { status: 400 },
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Response.json(
      { error: "Image files must be 8 MB or smaller." },
      { status: 413 },
    );
  }

  const metadata = uploadMetadataSchema.safeParse({
    title: formData.get("title"),
    alt: formData.get("alt"),
    caption: formData.get("caption") ?? "",
    category: formData.get("category"),
  });
  if (!metadata.success) {
    return Response.json(
      {
        error:
          "Check the image title, alternative text, caption, and category.",
      },
      { status: 400 },
    );
  }

  const input = Buffer.from(await file.arrayBuffer());
  let image: Awaited<ReturnType<typeof normalizeImage>>;
  try {
    image = await normalizeImage(input);
  } catch (error) {
    if (error instanceof InvalidImageError) {
      return Response.json({ error: error.message }, { status: 415 });
    }
    throw error;
  }

  let storage: StorageDriver;
  try {
    storage = getStorageDriver();
  } catch (error) {
    console.error("Gallery storage is not configured.", error);
    return Response.json(
      { error: "Gallery storage is not configured. Contact an administrator." },
      { status: 500 },
    );
  }
  const proposedKey = `gallery/${randomUUID()}.webp`;
  let storageKey: string;
  try {
    storageKey = await storage.put(proposedKey, image.data, "image/webp");
  } catch (error) {
    console.error("Could not store uploaded gallery image.", error);
    return Response.json(
      { error: "The image could not be stored. Please retry." },
      { status: 500 },
    );
  }
  const imageUrl = storage.publicUrl(storageKey);

  try {
    const item = await prisma.$transaction(async (transaction) => {
      const created = await transaction.galleryItem.create({
        data: {
          title: metadata.data.title,
          alt: metadata.data.alt,
          caption: metadata.data.caption || null,
          category: metadata.data.category,
          imageUrl,
          storageKey,
          blurDataUrl: image.blurDataUrl,
          width: image.width,
          height: image.height,
          published: false,
        },
      });
      await writeAuditLog(transaction, {
        userId: actor.id,
        action: "CREATE",
        entity: "GalleryItem",
        entityId: created.id,
        meta: { title: created.title, category: created.category },
      });
      return created;
    });

    return Response.json(
      { item: { id: item.id, title: item.title } },
      { status: 201 },
    );
  } catch (error) {
    try {
      await storage.delete(storageKey);
    } catch (cleanupError) {
      console.error(
        "Could not remove media after gallery record creation failed.",
        cleanupError,
      );
    }
    console.error("Could not save uploaded gallery image.", error);
    return Response.json(
      { error: "The image could not be added to the gallery. Please retry." },
      { status: 500 },
    );
  }
}
