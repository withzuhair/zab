import { expect, test } from "@playwright/test";

test("home page renders the shared layout", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveTitle(
    "ZAB Shipping LLC | Freight Forwarding & Logistics in Dubai",
  );
  await expect(
    page.getByRole("heading", { name: "Tell us what you're shipping." }),
  ).toBeAttached();
  const navigationName =
    (await page.evaluate(() => window.innerWidth)) < 768
      ? "Mobile navigation"
      : "Main navigation";
  if (navigationName === "Mobile navigation") {
    await page.locator("header details.md\\:hidden > summary").first().click();
  }
  await expect(
    page.getByRole("navigation", { name: navigationName }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Freight, handled." }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

test("home story scenes become visible while scrolling", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Tell us what you're shipping." }),
  ).toBeAttached();
  const story = page.getByRole("main", {
    name: "ZAB Shipping freight forwarding",
  });

  const isDesktop = (page.viewportSize()?.width ?? 0) >= 768;

  if (isDesktop) {
    const journey = page.locator("[data-journey]");
    await expect(journey).toBeVisible();
    for (const sceneId of [
      "air",
      "warehousing",
      "customs",
      "specialised",
      "proof",
      "cta",
    ]) {
      const scene = story.locator(`#scene-${sceneId}`);
      await scene.scrollIntoViewIfNeeded();
      await expect(scene.getByRole("heading")).toBeVisible();
    }
  } else {
    for (const sceneId of [
      "arrival",
      "one-roof",
      "ocean",
      "air",
      "warehousing",
      "customs",
      "specialised",
      "proof",
      "cta",
    ]) {
      const scene = story.locator(`#scene-${sceneId}`);
      await scene.scrollIntoViewIfNeeded();
      await expect(scene.getByRole("heading")).toBeVisible();
    }
  }

  expect(runtimeErrors).toEqual([]);
  await expect(
    page.getByRole("heading", { name: "Why choose ZAB" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "One team for every mode" }),
  ).toBeVisible();
});

test("home animations are cleaned up during client navigation", async ({
  page,
}) => {
  test.skip(
    (page.viewportSize()?.width ?? 0) < 768,
    "Pinned scenes are enabled on desktop viewports.",
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".pin-spacer").first()).toBeAttached();

  await page.getByRole("link", { name: "Meet ZAB Shipping" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator("[data-scene]").first()).toBeHidden();
  await expect(page.locator(".pin-spacer")).toHaveCount(0);

  await page.getByRole("link", { name: "ZAB Shipping LLC home" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("[data-scene]")).toHaveCount(9);
  await expect(page.locator("[data-journey]")).toBeVisible();
  await expect(page.locator(".pin-spacer").first()).toBeAttached();
});

test("home animation mode follows viewport and motion preference changes", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Tell us what you're shipping." }),
  ).toBeAttached();
  const story = page.locator("[data-home-story]").first();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(story).toHaveAttribute("data-animations-ready", "true");

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".pin-spacer").first()).toBeAttached();
  await expect(story).not.toHaveAttribute("data-animations-ready");

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(story).toHaveAttribute("data-animations-ready", "true");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(story).not.toHaveAttribute("data-animations-ready");
});

test("reduced motion keeps all home story content readable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const story = page.getByRole("main", {
    name: "ZAB Shipping freight forwarding",
  });
  await expect(story.locator("#scene-cta")).toBeAttached();

  for (const sceneId of [
    "arrival",
    "one-roof",
    "ocean",
    "air",
    "warehousing",
    "customs",
    "specialised",
    "proof",
    "cta",
  ]) {
    const scene = story.locator(`#scene-${sceneId}`);
    await scene.scrollIntoViewIfNeeded();
    await expect(scene.getByRole("heading")).toBeVisible();
  }

  const fixedSceneCount = await page
    .locator("[data-scene]")
    .evaluateAll(
      (scenes) =>
        scenes.filter((scene) => getComputedStyle(scene).position === "fixed")
          .length,
    );
  expect(fixedSceneCount).toBe(0);
});
