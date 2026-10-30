import { connection } from "next/server";
import { z } from "zod";
import { confirmationFlags } from "@content/confirm-flags";
import { galleryItems } from "@content/gallery";
import { services, type ServiceContent } from "@content/services";
import { site } from "@content/site";
import { prisma } from "@/lib/db";

const serviceSlugSchema = z.enum([
  "ocean-freight",
  "air-freight",
  "warehousing",
  "freight-forwarding",
  "specialised",
]);

const statValueSchema = z.object({
  label: z.string(),
  value: z.string(),
  claim: z.string(),
});

const hubValueSchema = z.object({ locations: z.array(z.string()) });
const warehouseValueSchema = z.object({ locations: z.string() });

export type PublicService = ServiceContent & { bodyMarkdown?: string };

export type PublicGalleryItem = {
  title: string;
  category: string;
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  blurDataUrl?: string;
};

export type PublicCompanySettings = {
  name: string;
  address: string;
  phone: string;
  email: string;
  whatsappUrl: string;
};

export type PublicContentSettings = {
  statistics: Record<
    (typeof statisticKeys)[number],
    { label: string; value: string; confirmed: boolean }
  >;
  hubs: { locations: readonly string[]; confirmed: boolean };
  warehouseLocations: { locations: string; confirmed: boolean };
};

const statisticKeys = ["shipments", "countries", "team", "years"] as const;

export async function getPublicServices(): Promise<PublicService[]> {
  await connection();
  const records = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  if (records.length === 0) {
    return services.map((service) => ({ ...service }));
  }

  return records
    .filter((record) => record.published)
    .map((record) => {
      const slug = serviceSlugSchema.parse(record.slug);
      const fallback = services.find((service) => service.slug === slug);

      if (!fallback) {
        throw new Error(
          `No public content template exists for service "${slug}".`,
        );
      }

      return {
        ...fallback,
        title: record.title,
        headline: record.headline,
        summary: record.summary,
        highlights: record.highlights,
        bodyMarkdown: record.body,
      };
    });
}

export async function getPublicGallery(): Promise<PublicGalleryItem[]> {
  await connection();
  const records = await prisma.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (records.length === 0) {
    return galleryItems.map((item) => ({
      ...item,
      width: 960,
      height: 640,
    }));
  }

  return records
    .filter((item) => item.published)
    .map((item) => ({
      title: item.title,
      category: item.category
        .toLowerCase()
        .replace(/^./, (letter) => letter.toUpperCase()),
      src: item.imageUrl,
      alt: item.alt,
      caption: item.caption ?? "",
      width: item.width ?? 960,
      height: item.height ?? 640,
      ...(item.blurDataUrl ? { blurDataUrl: item.blurDataUrl } : {}),
    }));
}

export async function getPublicCompanySettings(): Promise<PublicCompanySettings> {
  await connection();
  const records = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "company.name",
          "company.address",
          "company.phone",
          "company.email",
        ],
      },
    },
    select: { key: true, value: true },
  });
  const values = new Map(records.map((record) => [record.key, record.value]));
  const readString = (key: string, fallback: string) => {
    const value = values.get(key);
    if (value === undefined) return fallback;
    return z.string().parse(value);
  };
  const phone = readString("company.phone", site.phone);
  const whatsappNumber = phone.replace(/\D/g, "");

  return {
    name: readString("company.name", site.name),
    address: readString("company.address", site.address),
    phone,
    email: readString("company.email", site.email),
    whatsappUrl: whatsappNumber
      ? `https://wa.me/${whatsappNumber}`
      : site.whatsappUrl,
  };
}

export async function getPublicContentSettings(): Promise<PublicContentSettings> {
  await connection();
  const keys = [
    ...statisticKeys.map((key) => `stats.${key}`),
    "hubs",
    "warehouse.locations",
  ];
  const records = await prisma.setting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true, confirmed: true },
  });
  const byKey = new Map(records.map((record) => [record.key, record]));
  const readStatistic = (key: (typeof statisticKeys)[number]) => {
    const fallback = confirmationFlags.statistics[key];
    const row = byKey.get(`stats.${key}`);

    if (!row) {
      return {
        label: fallback.label,
        value: fallback.value,
        confirmed: fallback.confirmed,
      };
    }

    const value = statValueSchema.parse(row.value);
    return { label: value.label, value: value.value, confirmed: row.confirmed };
  };

  const statistics = {
    shipments: readStatistic("shipments"),
    countries: readStatistic("countries"),
    team: readStatistic("team"),
    years: readStatistic("years"),
  };
  const hubRow = byKey.get("hubs");
  const hubValue = hubRow
    ? hubValueSchema.parse(hubRow.value)
    : confirmationFlags.hubs;
  const warehouseRow = byKey.get("warehouse.locations");
  const warehouseValue = warehouseRow
    ? warehouseValueSchema.parse(warehouseRow.value)
    : confirmationFlags.warehouseLocations;

  return {
    statistics,
    hubs: {
      locations: hubValue.locations,
      confirmed: hubRow?.confirmed ?? confirmationFlags.hubs.confirmed,
    },
    warehouseLocations: {
      locations: warehouseValue.locations,
      confirmed:
        warehouseRow?.confirmed ??
        confirmationFlags.warehouseLocations.confirmed,
    },
  };
}
