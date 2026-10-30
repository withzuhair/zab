import { z } from "zod";

export const enquiryStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUOTED",
  "WON",
  "LOST",
  "SPAM",
]);

export const serviceTypeSchema = z.enum([
  "OCEAN",
  "AIR",
  "WAREHOUSING",
  "CUSTOMS",
  "RORO_PROJECT",
  "DANGEROUS_GOODS",
  "NOT_SURE",
]);

export const galleryCategorySchema = z.enum([
  "OCEAN",
  "AIR",
  "WAREHOUSE",
  "ROAD",
  "OTHER",
]);

export const adminRoleSchema = z.enum(["ADMIN", "STAFF"]);

export const idSchema = z.string().trim().min(1).max(64);

export const enquiryUpdateSchema = z.object({
  id: idSchema,
  status: enquiryStatusSchema,
  internalNotes: z.string().trim().max(5000),
});

export const serviceUpdateSchema = z.object({
  id: idSchema,
  headline: z.string().trim().min(5).max(180),
  summary: z.string().trim().min(5).max(500),
  body: z.string().trim().min(1).max(20_000),
  highlights: z.array(z.string().trim().min(1).max(150)).max(20),
  sortOrder: z.number().int().min(0).max(10_000),
  published: z.boolean(),
});

export const galleryUpdateSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(2).max(150),
  caption: z.string().trim().max(500),
  alt: z.string().trim().min(2).max(250),
  category: galleryCategorySchema,
  sortOrder: z.number().int().min(0).max(10_000),
  published: z.boolean(),
});

export const contactSettingsSchema = z.object({
  name: z.string().trim().min(2).max(150),
  address: z.string().trim().min(5).max(500),
  phone: z.string().trim().min(5).max(50),
  email: z.string().trim().email().max(254),
  hubs: z.array(z.string().trim().min(1).max(100)).max(50),
  hubsConfirmed: z.boolean(),
  statistics: z.array(
    z.object({
      key: z.enum(["shipments", "countries", "team", "years"]),
      label: z.string().trim().min(2).max(100),
      value: z.string().trim().max(50),
      confirmed: z.boolean(),
    }),
  ),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  role: adminRoleSchema,
});

export const userUpdateSchema = z.object({
  id: idSchema,
  role: adminRoleSchema,
  active: z.boolean(),
});

export const passwordResetSchema = z.object({
  id: idSchema,
  password: z.string().min(12).max(128),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current password.",
  });
