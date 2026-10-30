import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { Prisma } from "../../src/generated/prisma/client";
import { prisma } from "../../src/lib/db";
import { getLoginThrottleKeys } from "../../src/lib/admin/login-throttle-policy";

const password = "PhaseFive-Test-Password-2026!";

async function createTestAdmin(
  email: string,
  role: "ADMIN" | "STAFF" = "ADMIN",
) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.adminUser.create({
    data: {
      name: "Phase Five Test",
      email,
      passwordHash,
      role,
    },
  });
  return user;
}

async function signIn(page: Page, email: string, passwordValue = password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(passwordValue);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin(?:\/change-password)?(?:$|\?)/, {
    timeout: 45_000,
  });
}

async function submitServerAction(
  page: Page,
  button: Locator,
  pathname: string,
) {
  const responsePromise = page.waitForResponse((response) => {
    const request = response.request();
    return (
      request.method() === "POST" &&
      new URL(response.url()).pathname === pathname
    );
  });
  await button.click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
}

async function cleanTestAdmin(id: string) {
  await prisma.$transaction(async (transaction) => {
    await transaction.auditLog.deleteMany({ where: { userId: id } });
    await transaction.adminUser.deleteMany({ where: { id } });
  });
}

test("unauthenticated admin routes redirect to the sign-in page", async ({
  page,
}) => {
  await page.goto("/admin/enquiries");
  await expect(page).toHaveURL(/\/admin\/login\?callbackUrl=/);
  await expect(
    page.getByRole("heading", { name: "Admin sign in" }),
  ).toBeVisible();
});

test("admin login updates lastLoginAt and the dashboard is accessible", async ({
  page,
}, testInfo) => {
  const email = `admin-login-${testInfo.project.name}-${randomUUID()}@example.com`;
  const user = await createTestAdmin(email);
  const ip = `login-${randomUUID()}`;
  const throttleKeys = getLoginThrottleKeys(ip, email);

  try {
    await page.setExtraHTTPHeaders({ "x-real-ip": ip });
    await signIn(page, email);
    await expect(
      page.getByRole("heading", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    expect(
      (await prisma.adminUser.findUnique({ where: { id: user.id } }))
        ?.lastLoginAt,
    ).toBeInstanceOf(Date);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  } finally {
    await prisma.rateLimitHit.deleteMany({
      where: { key: { in: throttleKeys } },
    });
    await cleanTestAdmin(user.id);
  }
});

test("seeded admins must change their password before using the panel", async ({
  page,
}) => {
  const email = `initial-password-${randomUUID()}@example.com`;
  const initialPassword = "Initial-Temporary-Password-2026!";
  const newPassword = "New-Unique-Admin-Password-2026!";
  const passwordHash = await bcrypt.hash(initialPassword, 12);
  const user = await prisma.adminUser.create({
    data: {
      name: "Initial Password Test",
      email,
      passwordHash,
      role: "ADMIN",
      mustChangePassword: true,
    },
  });
  const ip = `password-change-${randomUUID()}`;
  const throttleKeys = getLoginThrottleKeys(ip, email);

  try {
    await page.setExtraHTTPHeaders({ "x-real-ip": ip });
    await signIn(page, email, initialPassword);
    await expect(page).toHaveURL(/\/admin\/change-password$/);
    await expect(
      page.getByRole("heading", { name: "Change your password" }),
    ).toBeVisible();

    await page.getByLabel("Current password").fill("incorrect-current");
    await page
      .getByLabel("New password (12 characters minimum)")
      .fill(newPassword);
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "The current password is incorrect.",
    );

    await page.getByLabel("Current password").fill(initialPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page).toHaveURL(/\/admin\/login\?passwordChanged=1$/);
    await expect(page.getByRole("status")).toHaveText(
      "Password updated. Sign in with your new password.",
    );

    await signIn(page, email, newPassword);
    await expect(
      page.getByRole("heading", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    expect(
      await prisma.adminUser.findUnique({ where: { id: user.id } }),
    ).toMatchObject({ mustChangePassword: false });
  } finally {
    await prisma.rateLimitHit.deleteMany({
      where: { key: { in: throttleKeys } },
    });
    await cleanTestAdmin(user.id);
  }
});

test("STAFF cannot open admin user or settings pages", async ({
  page,
}, testInfo) => {
  const email = `staff-access-${testInfo.project.name}-${randomUUID()}@example.com`;
  const user = await createTestAdmin(email, "STAFF");
  const ip = `staff-${randomUUID()}`;
  const throttleKeys = getLoginThrottleKeys(ip, email);

  try {
    await page.setExtraHTTPHeaders({ "x-real-ip": ip });
    await signIn(page, email);
    for (const route of ["/admin/users", "/admin/settings"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/admin$/);
      await expect(
        page.getByRole("heading", { name: "Dashboard", exact: true }),
      ).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
  } finally {
    await prisma.rateLimitHit.deleteMany({
      where: { key: { in: throttleKeys } },
    });
    await cleanTestAdmin(user.id);
  }
});

test("service edits are audited and appear on the public service page", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile-chromium",
    "Runs on desktop only.",
  );
  const email = `service-edit-${randomUUID()}@example.com`;
  const user = await createTestAdmin(email);
  const ip = `service-${randomUUID()}`;
  const throttleKeys = getLoginThrottleKeys(ip, email);
  const service = await prisma.service.findUniqueOrThrow({
    where: { slug: "ocean-freight" },
  });
  const headline = `Phase Five headline ${randomUUID().slice(0, 8)}`;

  try {
    await page.setExtraHTTPHeaders({ "x-real-ip": ip });
    await signIn(page, email);
    await page.goto(`/admin/services/${service.id}`);
    await page.getByLabel("Headline").fill(headline);
    await submitServerAction(
      page,
      page.getByRole("button", { name: "Save service" }),
      `/admin/services/${service.id}`,
    );
    await expect
      .poll(async () => {
        return (await prisma.service.findUnique({ where: { id: service.id } }))
          ?.headline;
      })
      .toBe(headline);
    await page.goto(`/services/${service.slug}`);
    await expect(page.getByRole("heading", { name: headline })).toBeVisible();
    expect(
      await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          entity: "Service",
          entityId: service.id,
          action: "UPDATE",
        },
      }),
    ).not.toBeNull();
  } finally {
    await prisma.service.update({
      where: { id: service.id },
      data: { headline: service.headline },
    });
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.rateLimitHit.deleteMany({
      where: { key: { in: throttleKeys } },
    });
    await cleanTestAdmin(user.id);
  }
});

test("confirmed statistics publish and settings changes are audited", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile-chromium",
    "Runs on desktop only.",
  );
  const email = `settings-${randomUUID()}@example.com`;
  const user = await createTestAdmin(email);
  const ip = `settings-${randomUUID()}`;
  const throttleKeys = getLoginThrottleKeys(ip, email);
  const original = await prisma.setting.findUniqueOrThrow({
    where: { key: "stats.shipments" },
  });
  const label = `Phase Five confirmed ${randomUUID().slice(0, 8)}`;

  try {
    await page.setExtraHTTPHeaders({ "x-real-ip": ip });
    await signIn(page, email);
    await page.goto("/admin/settings");
    const statistic = page.getByRole("group", { name: "shipments" });
    await statistic.getByLabel("Label").fill(label);
    await statistic.getByLabel("Value").fill("42");
    await statistic.getByLabel("Confirmed").check();
    await submitServerAction(
      page,
      page.getByRole("button", { name: "Save settings" }),
      "/admin/settings",
    );
    await expect(page).toHaveURL(/\/admin\/settings\?updated=1$/);
    await expect
      .poll(async () => {
        const setting = await prisma.setting.findUnique({
          where: { key: "stats.shipments" },
        });
        return setting?.value;
      })
      .toMatchObject({ label, value: "42" });
    const updatedStatistic = await prisma.setting.findUniqueOrThrow({
      where: { key: "stats.shipments" },
    });
    expect(updatedStatistic.confirmed).toBe(true);
    expect(updatedStatistic.value).toMatchObject({ label, value: "42" });
    await page.goto("/");
    await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(page.getByText("42", { exact: true })).toBeVisible();
    expect(
      await prisma.auditLog.findFirst({
        where: { userId: user.id, entity: "Settings", action: "UPDATE" },
      }),
    ).not.toBeNull();
  } finally {
    await prisma.setting.update({
      where: { key: original.key },
      data: {
        value: original.value === null ? Prisma.JsonNull : original.value,
        confirmed: original.confirmed,
      },
    });
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.rateLimitHit.deleteMany({
      where: { key: { in: throttleKeys } },
    });
    await cleanTestAdmin(user.id);
  }
});

test("enquiries can be searched, updated, audited, and exported as CSV", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile-chromium",
    "Runs on desktop only.",
  );
  const email = `enquiry-admin-${randomUUID()}@example.com`;
  const user = await createTestAdmin(email);
  const ip = `enquiry-${randomUUID()}`;
  const throttleKeys = getLoginThrottleKeys(ip, email);
  const enquiryEmail = `phase5-enquiry-${randomUUID()}@example.com`;
  const enquiry = await prisma.enquiry.create({
    data: {
      fullName: "Phase Five Enquiry",
      email: enquiryEmail,
      serviceType: "OCEAN",
      message: "Please quote this test shipment.",
      consent: true,
    },
  });

  try {
    await page.setExtraHTTPHeaders({ "x-real-ip": ip });
    await signIn(page, email);
    await page.goto(`/admin/enquiries?q=${encodeURIComponent(enquiryEmail)}`);
    await expect(page.getByText("Phase Five Enquiry")).toBeVisible();
    await page.getByRole("link", { name: "Phase Five Enquiry" }).click();
    const enquiryForm = page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: "Save enquiry" }) });
    await enquiryForm.getByLabel("Status").selectOption("CONTACTED");
    await page
      .getByLabel("Internal notes")
      .fill("Follow up with the customer.");
    await expect(enquiryForm.getByLabel("Status")).toHaveValue("CONTACTED");
    await submitServerAction(
      page,
      page.getByRole("button", { name: "Save enquiry" }),
      `/admin/enquiries/${enquiry.id}`,
    );
    await expect(page).toHaveURL(
      new RegExp(`/admin/enquiries/${enquiry.id}\\?updated=1$`),
    );
    await expect
      .poll(async () => {
        return (await prisma.enquiry.findUnique({ where: { id: enquiry.id } }))
          ?.status;
      })
      .toBe("CONTACTED");

    const updated = await prisma.enquiry.findUniqueOrThrow({
      where: { id: enquiry.id },
    });
    expect(updated.status).toBe("CONTACTED");
    expect(updated.internalNotes).toBe("Follow up with the customer.");
    expect(
      await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          entity: "Enquiry",
          entityId: enquiry.id,
          action: "UPDATE",
        },
      }),
    ).not.toBeNull();

    const csvResponse = await page.request.get(
      `/api/admin/enquiries/export?q=${encodeURIComponent(enquiryEmail)}`,
    );
    expect(csvResponse.status()).toBe(200);
    expect(csvResponse.headers()["content-type"]).toContain("text/csv");
    expect(await csvResponse.text()).toContain(enquiryEmail);
  } finally {
    await prisma.enquiry.deleteMany({ where: { id: enquiry.id } });
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.rateLimitHit.deleteMany({
      where: { key: { in: throttleKeys } },
    });
    await cleanTestAdmin(user.id);
  }
});

test("admin users can be created, updated, deactivated, and have passwords reset", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile-chromium",
    "Runs on desktop only.",
  );
  const email = `user-admin-${randomUUID()}@example.com`;
  const user = await createTestAdmin(email);
  const ip = `users-${randomUUID()}`;
  const throttleKeys = getLoginThrottleKeys(ip, email);
  const newEmail = `created-staff-${randomUUID()}@example.com`;
  const newPassword = "Updated-Phase-Five-Password!";

  try {
    await page.setExtraHTTPHeaders({ "x-real-ip": ip });
    await signIn(page, email);
    await page.goto("/admin/users");
    await page.getByLabel("Name", { exact: true }).fill("Created Staff");
    await page.getByLabel("Email", { exact: true }).fill(newEmail);
    await page
      .getByLabel("Temporary password (12 characters minimum)")
      .fill(password);
    await page
      .getByRole("combobox", { name: "Role" })
      .first()
      .selectOption("STAFF");
    await submitServerAction(
      page,
      page.getByRole("button", { name: "Create user" }),
      "/admin/users",
    );

    await expect
      .poll(async () => {
        return (
          await prisma.adminUser.findUnique({ where: { email: newEmail } })
        )?.role;
      })
      .toBe("STAFF");
    await page.reload();
    let created = await prisma.adminUser.findUniqueOrThrow({
      where: { email: newEmail },
    });
    expect(created.role).toBe("STAFF");
    expect(
      await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          action: "CREATE",
          entity: "AdminUser",
          entityId: created.id,
        },
      }),
    ).not.toBeNull();

    const userCard = page.locator("article").filter({ hasText: newEmail });
    await userCard.getByLabel("Role").selectOption("ADMIN");
    await submitServerAction(
      page,
      userCard.getByRole("button", { name: "Save access" }),
      "/admin/users",
    );
    await expect
      .poll(async () => {
        return (
          await prisma.adminUser.findUnique({ where: { email: newEmail } })
        )?.role;
      })
      .toBe("ADMIN");
    await page.reload();
    created = await prisma.adminUser.findUniqueOrThrow({
      where: { email: newEmail },
    });
    expect(created.role).toBe("ADMIN");

    const passwordForm = page.locator("article").filter({ hasText: newEmail });
    await passwordForm
      .getByLabel("Set new password (12 characters minimum)")
      .fill(newPassword);
    await submitServerAction(
      page,
      passwordForm.getByRole("button", { name: "Reset password" }),
      "/admin/users",
    );
    await expect
      .poll(async () => {
        const user = await prisma.adminUser.findUnique({
          where: { email: newEmail },
        });
        return user?.passwordHash !== created.passwordHash;
      })
      .toBe(true);
    await expect(
      page.getByText("Password reset.", { exact: true }),
    ).toBeVisible();
    created = await prisma.adminUser.findUniqueOrThrow({
      where: { email: newEmail },
    });
    expect(await bcrypt.compare(newPassword, created.passwordHash)).toBe(true);
    await page.reload();

    const accessForm = page
      .locator("article")
      .filter({ hasText: newEmail })
      .locator("form")
      .first();
    await accessForm.getByLabel("Active").uncheck();
    await submitServerAction(
      page,
      accessForm.getByRole("button", { name: "Save access" }),
      "/admin/users",
    );
    await expect(
      page.getByText("User access updated.", { exact: true }),
    ).toBeVisible();
    await expect
      .poll(async () => {
        return (
          await prisma.adminUser.findUnique({ where: { email: newEmail } })
        )?.active;
      })
      .toBe(false);
    created = await prisma.adminUser.findUniqueOrThrow({
      where: { email: newEmail },
    });
    expect(created.active).toBe(false);
    expect(
      await prisma.auditLog.count({
        where: { userId: user.id, entity: "AdminUser", entityId: created.id },
      }),
    ).toBeGreaterThanOrEqual(2);
    expect(
      await prisma.auditLog.count({
        where: {
          userId: user.id,
          entity: "AdminUserPassword",
          entityId: created.id,
        },
      }),
    ).toBe(1);
  } finally {
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.adminUser.deleteMany({
      where: { email: { in: [email, newEmail] } },
    });
    await prisma.rateLimitHit.deleteMany({
      where: { key: { in: throttleKeys } },
    });
  }
});

test("gallery edits and deletions are audited", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile-chromium",
    "Runs on desktop only.",
  );
  const email = `gallery-admin-${randomUUID()}@example.com`;
  const user = await createTestAdmin(email);
  const ip = `gallery-${randomUUID()}`;
  const throttleKeys = getLoginThrottleKeys(ip, email);
  const item = await prisma.galleryItem.create({
    data: {
      title: `Phase Five gallery ${randomUUID()}`,
      alt: "Test gallery image",
      imageUrl: "/images/placeholders/ocean-freight.svg",
      category: "OCEAN",
    },
  });

  const updatedTitle = `${item.title} updated`;

  try {
    await page.setExtraHTTPHeaders({ "x-real-ip": ip });
    await signIn(page, email);
    await page.goto("/admin/gallery");
    const card = page
      .locator("article")
      .filter({ has: page.getByAltText("Test gallery image") });
    await expect(card).toHaveCount(1);
    await expect(card.getByRole("textbox", { name: "Title" })).toHaveValue(
      item.title,
    );
    await card.getByRole("textbox", { name: "Title" }).fill(updatedTitle);
    await submitServerAction(
      page,
      card.getByRole("button", { name: "Save item" }),
      "/admin/gallery",
    );
    await expect
      .poll(async () => {
        return (await prisma.galleryItem.findUnique({ where: { id: item.id } }))
          ?.title;
      })
      .toBe(updatedTitle);
    expect(
      await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          entity: "GalleryItem",
          entityId: item.id,
          action: "UPDATE",
        },
      }),
    ).not.toBeNull();

    const updatedCard = page
      .locator("article")
      .filter({ has: page.getByAltText("Test gallery image") });
    await expect(
      updatedCard.getByRole("textbox", { name: "Title" }),
    ).toHaveValue(updatedTitle);
    await submitServerAction(
      page,
      updatedCard.getByRole("button", { name: "Delete item" }),
      "/admin/gallery",
    );
    await expect
      .poll(async () => {
        return prisma.galleryItem.findUnique({ where: { id: item.id } });
      })
      .toBeNull();
    expect(
      await prisma.galleryItem.findUnique({ where: { id: item.id } }),
    ).toBeNull();
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
    await prisma.galleryItem.deleteMany({ where: { id: item.id } });
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.rateLimitHit.deleteMany({
      where: { key: { in: throttleKeys } },
    });
    await cleanTestAdmin(user.id);
  }
});
