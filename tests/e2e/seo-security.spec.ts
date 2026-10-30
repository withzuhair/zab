import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/about",
  "/services",
  "/services/ocean-freight",
  "/services/air-freight",
  "/services/warehousing",
  "/services/freight-forwarding",
  "/services/specialised",
  "/gallery",
  "/contact",
  "/privacy",
];

test("robots, sitemap, canonical metadata, and social images are present", async ({
  page,
}) => {
  const robotsResponse = await page.request.get("/robots.txt");
  expect(robotsResponse.ok()).toBe(true);
  const robots = await robotsResponse.text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Disallow: /api");
  expect(robots).toContain("https://zabshipping.com/sitemap.xml");

  const sitemapResponse = await page.request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain("https://zabshipping.com/");
  expect(sitemap).toContain("https://zabshipping.com/services/ocean-freight");

  const imageResponse = await page.request.get("/opengraph-image");
  expect(imageResponse.ok()).toBe(true);
  expect(imageResponse.headers()["content-type"]).toContain("image/png");

  if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
    await page.goto("/");
    await expect(
      page.locator('script[src="https://plausible.io/js/script.js"]'),
    ).toHaveCount(0);
  }

  for (const route of publicRoutes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(1);
  }
});

test("security headers are applied to page and API responses", async ({
  page,
}) => {
  const pageResponse = await page.goto("/", {
    waitUntil: "domcontentloaded",
  });
  const pageHeaders = pageResponse?.headers() ?? {};
  expect(pageHeaders["content-security-policy"]).toContain(
    "default-src 'self'",
  );
  expect(pageHeaders["x-content-type-options"]).toBe("nosniff");
  expect(pageHeaders["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(pageHeaders["permissions-policy"]).toContain("camera=()");
  expect(pageHeaders["x-frame-options"]).toBe("DENY");

  const apiResponse = await page.request.get("/api/health");
  expect(apiResponse.headers()["x-content-type-options"]).toBe("nosniff");
});

test("public routes have no serious or critical axe violations", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const failures: string[] = [];

  for (const route of publicRoutes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    if (serious.length > 0) {
      failures.push(
        `${route}: ${serious.map(({ id, help }) => `${id}: ${help}`).join("; ")}`,
      );
    }
  }

  expect(failures).toEqual([]);
});
