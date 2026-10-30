import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { prisma } from "../../src/lib/db";
import { getLoginThrottleKeys } from "../../src/lib/admin/login-throttle-policy";
import { getStorageDriver } from "../../src/lib/storage";

const password = "PhaseSix-Test-Password-2026!";

async function createTestAdmin(email: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.adminUser.create({
    data: {
      name: "Phase Six Test",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });
}

async function signIn(page: Page, email: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin(?:$|\?)/, { timeout: 45_000 });
}

async function submitServerAction(
  page: Page,
  button: Locator,
  pathname: string,
) {
  const responsePromise = page.waitForResponse((response) => {
    return (
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === pathname
    );
  });
  await button.click();
  expect((await responsePromise).ok()).toBe(true);
}

async function cleanTestAdmin(id: string) {
  await prisma.$transaction(async (transaction) => {
    await transaction.auditLog.deleteMany({ where: { userId: id } });
    await transaction.adminUser.deleteMany({ where: { id } });
  });
}

test("gallery uploads reject disguised executables and save optimized WebP images", async ({
  page,
}) => {
  const email = `gallery-upload-${randomUUID()}@example.com`;
  const user = await createTestAdmin(email);
  const ip = `gallery-upload-${randomUUID()}`;
  const throttleKeys = getLoginThrottleKeys(ip, email);
  const title = `Phase Six upload ${randomUUID()}`;
  const validImage = await sharp({
    create: {
      width: 80,
      height: 60,
      channels: 3,
      background: "#2255aa",
    },
  })
    .png()
    .toBuffer();

  try {
    await page.setExtraHTTPHeaders({ "x-real-ip": ip });
    await signIn(page, email);
    await page.goto("/admin/gallery");

    const uploadForm = page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: "Upload image" }) });
    await uploadForm.getByLabel("Image file").setInputFiles({
      name: "oversized.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(8 * 1024 * 1024 + 1),
    });
    await uploadForm.getByLabel("Title").fill(title);
    await uploadForm.getByLabel("Alternative text").fill("Test cargo image");
    await uploadForm.getByRole("button", { name: "Upload image" }).click();
    await expect(uploadForm.getByRole("alert")).toHaveText(
      "Image files must be 8 MB or smaller.",
    );

    await uploadForm.getByLabel("Image file").setInputFiles({
      name: "payload.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("MZ executable payload"),
    });
    await uploadForm.getByRole("button", { name: "Upload image" }).click();
    await expect(uploadForm.getByRole("alert")).toHaveText(
      "Only JPEG, PNG, and WebP images are accepted.",
    );

    await uploadForm.getByLabel("Image file").setInputFiles({
      name: "cargo.png",
      mimeType: "image/png",
      buffer: validImage,
    });
    await uploadForm.getByRole("button", { name: "Upload image" }).click();

    await expect
      .poll(async () => {
        return prisma.galleryItem.findFirst({ where: { title } });
      })
      .not.toBeNull();
    const item = await prisma.galleryItem.findFirst({ where: { title } });
    if (!item) throw new Error("The uploaded gallery image was not persisted.");

    expect(item.published).toBe(false);
    expect(item.width).toBe(80);
    expect(item.height).toBe(60);
    expect(item.imageUrl).toMatch(/\.webp$/);
    expect(item.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    expect(
      await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          entity: "GalleryItem",
          entityId: item.id,
          action: "CREATE",
        },
      }),
    ).not.toBeNull();

    const itemTitleInput = page.locator(
      `input[name="title"][value="${title}"]`,
    );
    await expect(itemTitleInput).toBeVisible();
    const imageResponse = await page.request.get(
      new URL(item.imageUrl, page.url()).toString(),
    );
    expect(imageResponse.status()).toBe(200);
    expect(imageResponse.headers()["content-type"]).toContain("image/webp");

    const itemCard = page.locator("article").filter({ has: itemTitleInput });
    await itemCard.getByLabel("Published").check();
    await submitServerAction(
      page,
      itemCard.getByRole("button", { name: "Save item" }),
      "/admin/gallery",
    );
    await expect
      .poll(async () => {
        return (await prisma.galleryItem.findUnique({ where: { id: item.id } }))
          ?.published;
      })
      .toBe(true);

    await page.goto("/gallery");
    const publicImage = page.getByRole("img", { name: "Test cargo image" });
    await expect(publicImage).toBeVisible();
    await expect(publicImage).toHaveAttribute("width", "80");
    await expect(publicImage).toHaveAttribute("height", "60");
    await expect(publicImage).toHaveAttribute("src", item.imageUrl);
    await expect
      .poll(() =>
        publicImage.evaluate(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth === 80,
        ),
      )
      .toBe(true);

    await page.goto("/admin/gallery");
    const publishedCard = page
      .locator("article")
      .filter({ has: page.locator(`input[name="title"][value="${title}"]`) });
    await submitServerAction(
      page,
      publishedCard.getByRole("button", { name: "Delete item" }),
      "/admin/gallery",
    );
    await expect(page).toHaveURL(/\/admin\/gallery\?deleted=1$/);
    await expect
      .poll(async () => {
        return prisma.galleryItem.findUnique({ where: { id: item.id } });
      })
      .toBeNull();
    const deletedImageResponse = await page.request.get(
      new URL(item.imageUrl, page.url()).toString(),
    );
    expect(deletedImageResponse.status()).toBe(404);
    expect(
      await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          entity: "GalleryItem",
          entityId: item.id,
          action: "DELETE",
        },
      }),
    ).not.toBeNull();
  } finally {
    const item = await prisma.galleryItem.findFirst({ where: { title } });
    if (item?.storageKey) {
      await getStorageDriver().delete(item.storageKey);
    }
    await prisma.galleryItem.deleteMany({ where: { title } });
    await prisma.rateLimitHit.deleteMany({
      where: { key: { in: throttleKeys } },
    });
    await cleanTestAdmin(user.id);
  }
});

test("gallery items can be reordered and the change is audited", async ({
  page,
}) => {
  const email = `gallery-reorder-${randomUUID()}@example.com`;
  const user = await createTestAdmin(email);
  const ip = `gallery-reorder-${randomUUID()}`;
  const throttleKeys = getLoginThrottleKeys(ip, email);
  const highest = await prisma.galleryItem.aggregate({
    _max: { sortOrder: true },
  });
  const first = await prisma.galleryItem.create({
    data: {
      title: `Phase Six reorder first ${randomUUID()}`,
      alt: "First reorder test image",
      imageUrl: "/images/placeholders/ocean-freight.svg",
      category: "OCEAN",
      sortOrder: (highest._max.sortOrder ?? 0) + 1,
    },
  });
  const second = await prisma.galleryItem.create({
    data: {
      title: `Phase Six reorder second ${randomUUID()}`,
      alt: "Second reorder test image",
      imageUrl: "/images/placeholders/air-freight.svg",
      category: "AIR",
      sortOrder: first.sortOrder + 1,
    },
  });

  try {
    await page.setExtraHTTPHeaders({ "x-real-ip": ip });
    await signIn(page, email);
    await page.goto("/admin/gallery");
    const firstCard = page.locator("article").filter({
      has: page.locator(`input[name="title"][value="${first.title}"]`),
    });
    await firstCard
      .getByRole("button", { name: `Move ${first.title} down` })
      .click();
    await expect(page).toHaveURL(/\/admin\/gallery\?reordered=1$/);

    await expect
      .poll(async () => {
        const [updatedFirst, updatedSecond] = await Promise.all([
          prisma.galleryItem.findUnique({ where: { id: first.id } }),
          prisma.galleryItem.findUnique({ where: { id: second.id } }),
        ]);
        return (
          updatedFirst !== null &&
          updatedSecond !== null &&
          updatedFirst.sortOrder > updatedSecond.sortOrder
        );
      })
      .toBe(true);
    expect(
      await prisma.auditLog.count({
        where: {
          userId: user.id,
          entity: "GalleryItem",
          action: "UPDATE",
          entityId: { in: [first.id, second.id] },
        },
      }),
    ).toBeGreaterThan(0);
  } finally {
    await prisma.galleryItem.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.rateLimitHit.deleteMany({
      where: { key: { in: throttleKeys } },
    });
    await cleanTestAdmin(user.id);
  }
});
