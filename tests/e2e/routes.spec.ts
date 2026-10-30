import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/about",
  "/gallery",
  "/contact",
  "/privacy",
  "/services",
  "/services/ocean-freight",
  "/services/air-freight",
  "/services/warehousing",
  "/services/freight-forwarding",
  "/services/specialised",
];

const legacyRoutes: [string, string][] = [
  ["/index.html", "/"],
  ["/about.html", "/about"],
  ["/contact.html", "/contact"],
  ["/team.html", "/gallery"],
  ["/team.html.html", "/gallery"],
  ["/service-single.html", "/services/ocean-freight"],
  ["/warehousing.html", "/services/warehousing"],
  ["/service-right.html", "/services/air-freight"],
  ["/service-left.html", "/services/specialised"],
  ["/project-single.html", "/services/freight-forwarding"],
  ["/projects.html", "/services/freight-forwarding"],
  ["/service.html", "/"],
  ["/blog.html", "/"],
  ["/blog-left.html", "/"],
  ["/blog-right.html", "/"],
  ["/blog-single.html", "/"],
  ["/index-03.html", "/"],
];

test("public content routes render one page heading", async ({ page }) => {
  test.setTimeout(180_000);

  for (const route of publicRoutes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `${route} should return 200`).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("unconfirmed company claims remain hidden", async ({ page }) => {
  for (const route of ["/", "/about", "/services/ocean-freight"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });

    for (const claim of ["11K+", "125+", "120+"]) {
      await expect(page.getByText(claim, { exact: true })).toHaveCount(0);
    }
  }
});

test("gallery filters images and opens an accessible keyboard lightbox", async ({
  page,
}) => {
  await page.goto("/gallery");
  const filters = page.getByRole("group", {
    name: "Filter gallery by category",
  });
  await filters.getByRole("button", { name: "Ocean", exact: true }).click();
  await expect(page.locator("figure")).toHaveCount(2);

  const opener = page.getByRole("button", { name: "View Ocean freight" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Gallery image viewer" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Ocean freight · 1 of 2")).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Next image" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByText("Container ship · 2 of 2")).toBeVisible();
  await dialog.evaluate((element) => {
    const start = new Touch({
      identifier: 1,
      target: element,
      clientX: 200,
      clientY: 100,
    });
    const end = new Touch({
      identifier: 1,
      target: element,
      clientX: 100,
      clientY: 100,
    });
    element.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        changedTouches: [start],
        touches: [start],
      }),
    );
    element.dispatchEvent(
      new TouchEvent("touchend", {
        bubbles: true,
        changedTouches: [end],
        touches: [],
      }),
    );
  });
  await expect(dialog.getByText("Ocean freight · 1 of 2")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("legacy HTML routes redirect permanently", async ({ page }) => {
  for (const [source, destination] of legacyRoutes) {
    const response = await page.request.get(source, { maxRedirects: 0 });

    expect(response.status(), `${source} should redirect with 301`).toBe(301);
    expect(
      new URL(response.headers().location ?? "", "http://127.0.0.1").pathname,
    ).toBe(destination);
  }
});
