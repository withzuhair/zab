import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { confirmationFlags } from "../content/confirm-flags";
import { galleryItems } from "../content/gallery";
import { services } from "../content/services";
import { site } from "../content/site";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be configured before seeding.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedSettings() {
  const settings = [
    { key: "company.name", value: site.name, confirmed: true },
    { key: "company.address", value: site.address, confirmed: true },
    { key: "company.phone", value: site.phone, confirmed: true },
    { key: "company.email", value: site.email, confirmed: true },
    {
      key: "stats.shipments",
      value: confirmationFlags.statistics.shipments,
      confirmed: false,
    },
    {
      key: "stats.countries",
      value: confirmationFlags.statistics.countries,
      confirmed: false,
    },
    {
      key: "stats.team",
      value: confirmationFlags.statistics.team,
      confirmed: false,
    },
    {
      key: "stats.years",
      value: confirmationFlags.statistics.years,
      confirmed: false,
    },
    {
      key: "hubs",
      value: confirmationFlags.hubs,
      confirmed: false,
    },
    {
      key: "warehouse.locations",
      value: confirmationFlags.warehouseLocations,
      confirmed: false,
    },
    {
      key: "certifications.qms",
      value: confirmationFlags.certifications.qms,
      confirmed: false,
    },
    {
      key: "membership",
      value: confirmationFlags.membership,
      confirmed: false,
    },
    {
      key: "response.time",
      value: confirmationFlags.responseTime,
      confirmed: false,
    },
    {
      key: "office.hours",
      value: confirmationFlags.officeHours,
      confirmed: false,
    },
  ] satisfies {
    key: string;
    value: Prisma.InputJsonValue;
    confirmed: boolean;
  }[];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password || password === "change-me-immediately") {
    throw new Error(
      "Set SEED_ADMIN_EMAIL and a unique SEED_ADMIN_PASSWORD before seeding the administrator.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const name = email.split("@")[0] ?? "ZAB Administrator";

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      mustChangePassword: true,
    },
  });
}

async function seedServices() {
  for (const [sortOrder, service] of services.entries()) {
    const body = [
      ...service.paragraphs,
      ...service.sections.flatMap((section) => [
        `## ${section.title}`,
        section.body,
        ...section.items.map((item) => `- ${item}`),
      ]),
      ...(service.commodities.length
        ? ["## Commodities", ...service.commodities.map((item) => `- ${item}`)]
        : []),
      ...(service.closing ? [service.closing] : []),
    ].join("\n\n");

    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: {
        slug: service.slug,
        title: service.title,
        headline: service.headline,
        summary: service.summary,
        body,
        highlights: [...service.highlights],
        sortOrder,
        published: true,
      },
    });
  }
}

async function seedGallery() {
  const categories = {
    Ocean: "OCEAN",
    Air: "AIR",
    Warehouse: "WAREHOUSE",
    Road: "ROAD",
  } as const;

  for (const [sortOrder, item] of galleryItems.entries()) {
    const id = `seed-gallery-${sortOrder}`;

    await prisma.galleryItem.upsert({
      where: { id },
      update: {},
      create: {
        id,
        title: item.title,
        caption: item.caption,
        alt: item.alt,
        category: categories[item.category],
        imageUrl: item.src,
        sortOrder,
        published: true,
      },
    });
  }
}

async function main() {
  await seedAdmin();
  await seedServices();
  await seedSettings();
  await seedGallery();
  console.info("Database seed completed.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
