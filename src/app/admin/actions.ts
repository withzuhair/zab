"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveAdmin, requireAdmin, requireRole } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  contactSettingsSchema,
  enquiryUpdateSchema,
  galleryUpdateSchema,
  idSchema,
  passwordChangeSchema,
  passwordResetSchema,
  serviceUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
} from "@/lib/admin/validation";
import { confirmationFlags } from "@content/confirm-flags";
import { getStorageDriver } from "@/lib/storage";

function formString(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

type PasswordChangeResult = { ok: false; message: string } | { ok: true };

export async function changeOwnPassword(
  data: FormData,
): Promise<PasswordChangeResult> {
  const actor = await getActiveAdmin();
  if (!actor) {
    return { ok: false, message: "Your session has expired. Sign in again." };
  }
  if (!actor.mustChangePassword) {
    return { ok: false, message: "A password change is not required." };
  }

  const input = passwordChangeSchema.safeParse({
    currentPassword: formString(data, "currentPassword"),
    newPassword: formString(data, "newPassword"),
    confirmPassword: formString(data, "confirmPassword"),
  });
  if (!input.success) {
    return {
      ok: false,
      message: "Use a new password of at least 12 characters and confirm it.",
    };
  }

  const user = await prisma.adminUser.findFirst({
    where: { id: actor.id, active: true, mustChangePassword: true },
    select: { passwordHash: true },
  });
  if (!user) {
    return { ok: false, message: "Your account is no longer available." };
  }
  if (!(await bcrypt.compare(input.data.currentPassword, user.passwordHash))) {
    return { ok: false, message: "The current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(input.data.newPassword, 12);
  const changed = await prisma.$transaction(async (transaction) => {
    const result = await transaction.adminUser.updateMany({
      where: {
        id: actor.id,
        active: true,
        mustChangePassword: true,
        passwordHash: user.passwordHash,
      },
      data: {
        passwordHash,
        passwordVersion: { increment: 1 },
        mustChangePassword: false,
      },
    });
    if (result.count !== 1) {
      return false;
    }

    await writeAuditLog(transaction, {
      userId: actor.id,
      action: "UPDATE",
      entity: "AdminUserPassword",
      entityId: actor.id,
      meta: { selfService: true, requiredChange: true },
    });
    return true;
  });

  if (!changed) {
    return {
      ok: false,
      message: "Your account changed during this update. Sign in again.",
    };
  }

  return { ok: true };
}

export async function updateEnquiry(data: FormData) {
  const actor = await requireAdmin();
  const input = enquiryUpdateSchema.parse({
    id: formString(data, "id"),
    status: formString(data, "status"),
    internalNotes: formString(data, "internalNotes"),
  });

  await prisma.$transaction(async (transaction) => {
    await transaction.enquiry.update({
      where: { id: input.id },
      data: {
        status: input.status,
        internalNotes: input.internalNotes || null,
      },
    });
    await writeAuditLog(transaction, {
      userId: actor.id,
      action: "UPDATE",
      entity: "Enquiry",
      entityId: input.id,
      meta: { status: input.status, internalNotesUpdated: true },
    });
  });

  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${input.id}`);
  redirect(`/admin/enquiries/${input.id}?updated=1`);
}

export async function updateService(data: FormData) {
  const actor = await requireAdmin();
  const input = serviceUpdateSchema.parse({
    id: formString(data, "id"),
    headline: formString(data, "headline"),
    summary: formString(data, "summary"),
    body: formString(data, "body"),
    highlights: formString(data, "highlights")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    sortOrder: Number(formString(data, "sortOrder")),
    published: data.get("published") === "on",
  });

  const service = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.service.update({
      where: { id: input.id },
      data: {
        headline: input.headline,
        summary: input.summary,
        body: input.body,
        highlights: input.highlights,
        sortOrder: input.sortOrder,
        published: input.published,
      },
      select: { id: true, slug: true },
    });
    await writeAuditLog(transaction, {
      userId: actor.id,
      action: "UPDATE",
      entity: "Service",
      entityId: updated.id,
      meta: { slug: updated.slug },
    });
    return updated;
  });

  revalidatePath("/services");
  revalidatePath(`/services/${service.slug}`);
  revalidatePath("/");
  redirect(`/admin/services/${service.id}?updated=1`);
}

export async function updateGalleryItem(data: FormData) {
  const actor = await requireAdmin();
  const input = galleryUpdateSchema.parse({
    id: formString(data, "id"),
    title: formString(data, "title"),
    caption: formString(data, "caption"),
    alt: formString(data, "alt"),
    category: formString(data, "category"),
    sortOrder: Number(formString(data, "sortOrder")),
    published: data.get("published") === "on",
  });

  await prisma.$transaction(async (transaction) => {
    const updated = await transaction.galleryItem.update({
      where: { id: input.id },
      data: {
        title: input.title,
        caption: input.caption || null,
        alt: input.alt,
        category: input.category,
        sortOrder: input.sortOrder,
        published: input.published,
      },
      select: { id: true, title: true },
    });
    await writeAuditLog(transaction, {
      userId: actor.id,
      action: "UPDATE",
      entity: "GalleryItem",
      entityId: updated.id,
      meta: { title: updated.title },
    });
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  redirect("/admin/gallery?updated=1");
}

export async function deleteGalleryItem(data: FormData) {
  const actor = await requireAdmin();
  const id = idSchema.parse(formString(data, "id"));
  const existing = await prisma.galleryItem.findUniqueOrThrow({
    where: { id },
    select: { storageKey: true },
  });
  const storage = existing.storageKey ? getStorageDriver() : null;

  const deleted = await prisma.$transaction(async (transaction) => {
    const deleted = await transaction.galleryItem.delete({
      where: { id },
      select: { id: true, title: true, storageKey: true },
    });
    await writeAuditLog(transaction, {
      userId: actor.id,
      action: "DELETE",
      entity: "GalleryItem",
      entityId: deleted.id,
      meta: { title: deleted.title },
    });
    return deleted;
  });

  if (deleted.storageKey && storage) {
    try {
      await storage.delete(deleted.storageKey);
    } catch (error) {
      console.error(
        "Gallery record was removed but its media could not be deleted.",
        error,
      );
      throw new Error(
        "Gallery record was removed, but the stored image could not be deleted.",
      );
    }
  }

  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  redirect("/admin/gallery?deleted=1");
}

export async function moveGalleryItem(data: FormData) {
  const actor = await requireAdmin();
  const id = idSchema.parse(formString(data, "id"));
  const direction = z.enum(["up", "down"]).parse(formString(data, "direction"));

  await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw<{ locked: number }[]>`
      WITH lock_result AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(hashtext('gallery-item-reorder'))
      )
      SELECT 1 AS locked FROM lock_result
    `;

    const items = await transaction.galleryItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: { id: true, title: true, sortOrder: true },
    });
    const currentIndex = items.findIndex((item) => item.id === id);
    const targetIndex = currentIndex + (direction === "up" ? -1 : 1);
    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= items.length) {
      throw new Error("The requested gallery item cannot be moved.");
    }

    const reordered = [...items];
    [reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex]!,
      reordered[currentIndex]!,
    ];

    for (const [sortOrder, item] of reordered.entries()) {
      if (item.sortOrder === sortOrder) continue;
      const updated = await transaction.galleryItem.update({
        where: { id: item.id },
        data: { sortOrder },
        select: { id: true, title: true },
      });
      await writeAuditLog(transaction, {
        userId: actor.id,
        action: "UPDATE",
        entity: "GalleryItem",
        entityId: updated.id,
        meta: { title: updated.title, sortOrder },
      });
    }
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  redirect("/admin/gallery?reordered=1");
}

export async function updateSettings(data: FormData) {
  const actor = await requireRole("ADMIN");
  const statistics = ["shipments", "countries", "team", "years"] as const;
  const input = contactSettingsSchema.parse({
    name: formString(data, "name"),
    address: formString(data, "address"),
    phone: formString(data, "phone"),
    email: formString(data, "email"),
    hubs: formString(data, "hubs")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    hubsConfirmed: data.get("hubsConfirmed") === "on",
    statistics: statistics.map((key) => ({
      key,
      label: formString(data, `stats.${key}.label`),
      value: formString(data, `stats.${key}.value`),
      confirmed: data.get(`stats.${key}.confirmed`) === "on",
    })),
  });

  await prisma.$transaction(async (transaction) => {
    const settingValues = [
      { key: "company.name", value: input.name, confirmed: true },
      { key: "company.address", value: input.address, confirmed: true },
      { key: "company.phone", value: input.phone, confirmed: true },
      { key: "company.email", value: input.email, confirmed: true },
      {
        key: "hubs",
        value: { locations: input.hubs },
        confirmed: input.hubsConfirmed,
      },
      ...input.statistics.map((statistic) => {
        const fallback = confirmationFlags.statistics[statistic.key];
        return {
          key: `stats.${statistic.key}`,
          value: {
            label: statistic.label,
            value: statistic.value,
            claim: fallback.claim,
          },
          confirmed: statistic.confirmed,
        };
      }),
    ];

    for (const setting of settingValues) {
      await transaction.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value, confirmed: setting.confirmed },
        create: setting,
      });
    }

    await writeAuditLog(transaction, {
      userId: actor.id,
      action: "UPDATE",
      entity: "Settings",
      meta: { keys: settingValues.map(({ key }) => key) },
    });
  });

  for (const path of ["/", "/about", "/services/warehousing"]) {
    revalidatePath(path);
  }
  redirect("/admin/settings?updated=1");
}

export async function createAdminUser(data: FormData) {
  const actor = await requireRole("ADMIN");
  const input = userCreateSchema.parse({
    name: formString(data, "name"),
    email: formString(data, "email"),
    password: formString(data, "password"),
    role: formString(data, "role"),
  });
  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.$transaction(async (transaction) => {
    const created = await transaction.adminUser.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        mustChangePassword: true,
      },
      select: { id: true, email: true, role: true },
    });
    await writeAuditLog(transaction, {
      userId: actor.id,
      action: "CREATE",
      entity: "AdminUser",
      entityId: created.id,
      meta: { email: created.email, role: created.role },
    });
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?created=1");
}

export async function updateAdminUser(data: FormData) {
  const actor = await requireRole("ADMIN");
  const input = userUpdateSchema.parse({
    id: formString(data, "id"),
    role: formString(data, "role"),
    active: data.get("active") === "on",
  });

  if (input.id === actor.id && (!input.active || input.role !== "ADMIN")) {
    throw new Error("You cannot deactivate or demote your own account.");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw<{ locked: number }[]>`
      WITH lock_result AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(hashtext('admin-user-maintenance'))
      )
      SELECT 1 AS locked FROM lock_result
    `;

    const target = await transaction.adminUser.findUniqueOrThrow({
      where: { id: input.id },
      select: { role: true, active: true },
    });
    const removesActiveAdmin =
      target.role === "ADMIN" &&
      target.active &&
      (input.role !== "ADMIN" || !input.active);

    if (removesActiveAdmin) {
      const activeAdmins = await transaction.adminUser.count({
        where: { role: "ADMIN", active: true },
      });
      if (activeAdmins <= 1) {
        throw new Error("At least one active administrator must remain.");
      }
    }

    const updated = await transaction.adminUser.update({
      where: { id: input.id },
      data: {
        role: input.role,
        active: input.active,
        passwordVersion: { increment: 1 },
      },
      select: { id: true, email: true, role: true, active: true },
    });
    await writeAuditLog(transaction, {
      userId: actor.id,
      action: "UPDATE",
      entity: "AdminUser",
      entityId: updated.id,
      meta: {
        email: updated.email,
        role: updated.role,
        active: updated.active,
      },
    });
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?updated=1");
}

export async function resetAdminPassword(data: FormData) {
  const actor = await requireRole("ADMIN");
  const input = passwordResetSchema.parse({
    id: formString(data, "id"),
    password: formString(data, "password"),
  });
  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.$transaction(async (transaction) => {
    const user = await transaction.adminUser.update({
      where: { id: input.id },
      data: {
        passwordHash,
        passwordVersion: { increment: 1 },
        mustChangePassword: true,
      },
      select: { id: true, email: true },
    });
    await writeAuditLog(transaction, {
      userId: actor.id,
      action: "UPDATE",
      entity: "AdminUserPassword",
      entityId: user.id,
      meta: { email: user.email },
    });
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?passwordReset=1");
}
