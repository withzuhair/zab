import { createHmac, randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { prisma } from "../../src/lib/db";

function quotePayload(email: string) {
  return {
    fullName: "Phase Four Test",
    company: "ZAB Test",
    email,
    phone: "+971 50 123 4567",
    serviceType: "OCEAN",
    origin: "Dubai",
    destination: "Singapore",
    cargoType: "General cargo",
    weightVolume: "100 kg",
    message: "Please provide a quote for this test shipment.",
    consent: true,
    honeypot: "",
    turnstileToken: "",
    sourcePage: "/contact",
  };
}

function getRateLimitKey(scope: "enquiry" | "newsletter", ip: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET must be set for rate-limit integration tests.",
    );
  }

  const salt = createHmac("sha256", secret).update(`${scope}-ip-salt`).digest();
  return createHmac("sha256", salt).update(ip).digest("hex");
}

test("contact form saves an enquiry with only a hashed client IP", async ({
  page,
}, testInfo) => {
  const email = `phase4-${testInfo.project.name}@example.com`;
  const ip = `contact-${randomUUID()}`;
  const rateLimitKey = getRateLimitKey("enquiry", ip);
  await prisma.enquiry.deleteMany({ where: { email } });

  try {
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": ip,
      "x-real-ip": ip,
    });
    await page.goto("/contact", { waitUntil: "networkidle" });
    const form = page.locator("main form");
    await form.getByLabel("Full name").fill("Phase Four Test");
    await form.getByLabel("Company").fill("ZAB Test");
    await form.getByLabel(/^Email/).fill(email);
    await form.getByLabel("Phone or WhatsApp").fill("+971 50 123 4567");
    const serviceType = form.getByLabel("Service type");
    await serviceType.selectOption("OCEAN");
    await expect(serviceType).toHaveValue("OCEAN");
    await form.getByLabel("Origin").fill("Dubai");
    await form.getByLabel("Destination").fill("Singapore");
    await form.getByLabel("Cargo type").fill("General cargo");
    await form.getByLabel("Approximate weight or volume").fill("100 kg");
    await form
      .getByLabel("Message")
      .fill("Please provide a quote for this test shipment.");
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Send enquiry" }).click();

    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Thanks, we have your request." }),
    ).toBeVisible();

    const enquiry = await prisma.enquiry.findFirst({ where: { email } });
    expect(enquiry).not.toBeNull();
    expect(enquiry?.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(enquiry?.ipHash).not.toBe("127.0.0.1");
    expect(enquiry?.sourcePage).toBe("/contact");
  } finally {
    await prisma.enquiry.deleteMany({ where: { email } });
    await prisma.rateLimitHit.deleteMany({ where: { key: rateLimitKey } });
  }
});

test("invalid enquiries return field errors", async ({ request }) => {
  const response = await request.post("/api/enquiries", {
    data: { email: "not-an-email" },
  });
  const result = await response.json();

  expect(response.status()).toBe(400);
  expect(result.error.code).toBe("VALIDATION");
  expect(result.error.fields).toHaveProperty("fullName");
  expect(result.error.fields).toHaveProperty("email");
});

test("filled enquiry honeypot is discarded without storing a record", async ({
  request,
}) => {
  const email = `honeypot-${randomUUID()}@example.com`;
  const response = await request.post("/api/enquiries", {
    data: { ...quotePayload(email), honeypot: "bot-filled" },
  });
  const result = await response.json();

  expect(response.status()).toBe(200);
  expect(result).toEqual({ ok: true });
  expect(await prisma.enquiry.findFirst({ where: { email } })).toBeNull();
});

test("sixth valid enquiry from an IP is rate limited", async ({ request }) => {
  const ip = `phase4-${randomUUID()}`;
  const emailPrefix = `rate-limit-${randomUUID()}`;
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET must be set for the rate-limit integration test.",
    );
  }

  const salt = createHmac("sha256", secret).update("enquiry-ip-salt").digest();
  const key = createHmac("sha256", salt).update(ip).digest("hex");

  const responses = [];

  try {
    for (let index = 0; index < 6; index += 1) {
      responses.push(
        await request.post("/api/enquiries", {
          headers: { "x-forwarded-for": ip, "x-real-ip": ip },
          data: quotePayload(`${emailPrefix}-${index}@example.com`),
        }),
      );
    }

    expect(responses.slice(0, 5).map((response) => response.status())).toEqual([
      200, 200, 200, 200, 200,
    ]);
    const limitedResponse = responses[5];
    if (!limitedResponse) {
      throw new Error(
        "The sixth rate-limit request did not return a response.",
      );
    }

    expect(limitedResponse.status()).toBe(429);
    expect((await limitedResponse.json()).error.code).toBe("RATE_LIMIT");
  } finally {
    await prisma.enquiry.deleteMany({
      where: { email: { startsWith: emailPrefix } },
    });
    await prisma.rateLimitHit.deleteMany({ where: { key } });
  }
});

test("newsletter footer stores a subscription", async ({ page }, testInfo) => {
  const email = `newsletter-${testInfo.project.name}@example.com`;
  const ip = `newsletter-${randomUUID()}`;
  const rateLimitKey = getRateLimitKey("newsletter", ip);
  await prisma.newsletterSubscriber.deleteMany({ where: { email } });

  try {
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": ip,
      "x-real-ip": ip,
    });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Subscribe" }).click();

    await expect(page.getByRole("status")).toHaveText(
      "You're subscribed. Thank you.",
    );
    expect(
      await prisma.newsletterSubscriber.findUnique({ where: { email } }),
    ).not.toBeNull();
  } finally {
    await prisma.newsletterSubscriber.deleteMany({ where: { email } });
    await prisma.rateLimitHit.deleteMany({ where: { key: rateLimitKey } });
  }
});

test("health endpoint confirms database connectivity", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});

test("floating quote CTA opens the quote form dialog", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile-chromium",
    "The floating desktop CTA is hidden at mobile widths.",
  );

  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Get a Quote" }).click();

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", {
      name: "Tell us what you're shipping.",
    }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Full name")).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("quote and newsletter forms have no axe violations", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "domcontentloaded" });

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
