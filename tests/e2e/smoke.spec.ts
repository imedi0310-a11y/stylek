import { expect, test, type Page } from "@playwright/test";

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("core pages", () => {
  test("home explains the app and links to the main flows", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find Your Perfect Hairstyle");
    await expect(page.getByRole("link", { name: "Find My Hairstyle" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Try Hairstyles" })).toBeVisible();
    await noHorizontalOverflow(page);
    await page.getByRole("link", { name: "Find My Hairstyle" }).click();
    await expect(page).toHaveURL(/\/finder/);
    expect(errors).toEqual([]);
  });

  test("collections, search and filters use the dataset", async ({ page }) => {
    await page.goto("/styles?category=men");
    const status = page.getByRole("status").filter({ hasText: /styles?$/ });
    await expect(status).toHaveText("19 styles");
    await page.getByRole("button", { name: "Women", exact: true }).click();
    await expect(status).toHaveText("19 styles");
    await page.getByRole("searchbox").fill("bob");
    await expect(page.getByRole("heading", { name: "Classic Bob" })).toBeVisible();
    await page.getByRole("searchbox").fill("zzzz");
    await expect(page.getByText("No styles match these filters")).toBeVisible();
    await page.getByRole("button", { name: "Reset filters" }).first().click();
    await expect(status).toHaveText("38 styles");
    await page.getByRole("button", { name: "Show filters" }).click();
    await page.getByRole("button", { name: "Coily" }).click();
    await page.getByRole("button", { name: "Short" }).click();
    await expect(page.getByRole("heading", { name: "Tapered Natural Coils" })).toBeVisible();
    await noHorizontalOverflow(page);
  });

  test("a filter clicked just before typing a search is kept", async ({ page }) => {
    // Slow the router's server round-trip so the URL update is still in flight while typing.
    await page.route("**/styles**", async (route) => {
      if (route.request().headers()["rsc"]) await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto("/styles?category=men");
    const status = page.getByRole("status").filter({ hasText: /styles?$/ });
    await expect(status).toHaveText("19 styles");
    await page.getByRole("button", { name: "Women", exact: true }).click();
    await page.getByRole("searchbox").fill("bob");
    await expect(page.getByRole("button", { name: "Women", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "Classic Bob" })).toBeVisible();
    await expect(page).toHaveURL(/category=women/, { timeout: 10_000 });
    await expect(page).toHaveURL(/q=bob/);
    // Once the delayed navigations land, the selection must still be intact.
    await page.waitForTimeout(2000);
    await expect(page.getByRole("button", { name: "Women", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("searchbox")).toHaveValue("bob");
  });

  test("catalogue follows URL changes made by in-app links", async ({ page }) => {
    await page.goto("/styles?category=women&q=bob");
    await expect(page.getByRole("searchbox")).toHaveValue("bob");
    const status = page.getByRole("status").filter({ hasText: /styles?$/ });
    // Client-side navigation to the unfiltered catalogue (same page component, new search params).
    await page.evaluate(() => {
      const link = [...document.querySelectorAll<HTMLAnchorElement>('a[href="/styles"]')].find((a) => a.offsetParent);
      link?.click();
    });
    await expect(page).toHaveURL(/\/styles$/);
    await expect(page.getByRole("searchbox")).toHaveValue("");
    await expect(status).toHaveText("38 styles");
    await expect(page.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("favorites persist after refresh", async ({ page }) => {
    await page.goto("/styles/pixie-cut");
    await page.getByRole("button", { name: "Save to favorites", exact: true }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/favorites");
    await expect(page.getByRole("heading", { name: "Pixie Cut" })).toBeVisible();
    await page.getByRole("button", { name: /Remove from favorites: Pixie Cut/ }).click();
    await expect(page.getByText("No favorites yet")).toBeVisible();
  });

  test("Arabic switches the interface to right-to-left", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.getByLabel("Language").selectOption("ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("اعثر على تسريحتك");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await noHorizontalOverflow(page);
    await page.getByLabel("اللغة").selectOption("fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Trouvez la coiffure");
  });

  test("barber card uses the style's metadata", async ({ page }) => {
    await page.goto("/styles/low-taper-fade/card");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Low Taper Fade");
    await expect(page.getByText("Please use this photo as a reference and discuss any adjustments with me before cutting.").first()).toBeVisible();
    await expect(page.getByText("Taper starts low, just above the ear and at the nape.").first()).toBeVisible();
    await page.getByLabel(/My extra instructions/).fill("<b>keep</b> the back longer");
    await page.locator("summary").click();
    await expect(page.getByTestId("card-text")).toContainText("<b>keep</b> the back longer");
    await expect(page.locator("article b")).toHaveCount(0);
    await noHorizontalOverflow(page);
  });

  test("style finder returns explained recommendations", async ({ page }) => {
    await page.goto("/finder");
    const answers = ["Women", "Medium", "Curly", "Natural", "Moderate", "Not sure", "Subtle"];
    for (const [i, answer] of answers.entries()) {
      await page.getByText(answer, { exact: true }).click();
      await page.getByRole("button", { name: i === answers.length - 1 ? "Show Results" : "Next" }).click();
    }
    await expect(page.getByRole("heading", { name: "Your suggestions" })).toBeVisible();
    const cards = page.getByTestId("recommendation");
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
    await expect(cards.first()).toContainText("Listed as working with curly hair.");
    await page.getByRole("button", { name: "Edit answers" }).click();
    await expect(page.getByRole("heading", { name: "How much change do you want?" })).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByLabel("Not sure")).toBeChecked();
  });

  test("unknown pages show the custom 404", async ({ page }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("SEO files are served", async ({ request }) => {
    expect((await request.get("/robots.txt")).ok()).toBe(true);
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/styles/low-taper-fade");
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest.name).toBe("Stylek AI");
  });
});

test.describe("try-on", () => {
  async function choose(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Choose From Gallery" }).first().click();
    await (await chooser).setFiles(file);
  }

  async function samplePng(page: Page): Promise<Buffer> {
    await page.setContent('<div style="width:400px;height:500px;background:linear-gradient(#333,#c99)"></div>');
    return page.locator("div").screenshot();
  }

  test("camera permission denial is explained", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        value: { getUserMedia: () => Promise.reject(new DOMException("denied", "NotAllowedError")) },
      });
    });
    await page.goto("/try-on");
    await page.getByRole("button", { name: "Take Photo" }).click();
    await expect(page.locator("main [role=alert]")).toContainText("Camera permission was denied");
  });

  test("gallery photo, confirmation and honest reference comparison", async ({ page }) => {
    const png = await samplePng(page);
    await page.goto("/try-on?style=wolf-cut");
    await expect(page.getByRole("button", { name: "Show Comparison" })).toBeDisabled();

    await choose(page, { name: "x.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.locator("main [role=alert]")).toContainText("Unsupported file type");

    await choose(page, { name: "me.png", mimeType: "image/png", buffer: png });
    await expect(page.getByRole("heading", { name: "Check your photo" })).toBeVisible();
    await page.getByRole("button", { name: "Use This Photo" }).click();
    await expect(page.getByText("Photo ready")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Wolf Cut" })).toHaveAttribute("aria-checked", "true");

    await page.getByRole("button", { name: "Show Comparison" }).click();
    await expect(page.getByTestId("result-label")).toHaveText(/not a transformation of your photo/);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save Result" }).click();
    expect((await download).suggestedFilename()).toBe("stylek-wolf-cut-reference.png");

    await page.getByRole("button", { name: "Remove Photo" }).click();
    await expect(page.getByText("Add a photo to begin").first()).toBeVisible();
    await noHorizontalOverflow(page);
  });

  test("shape guide refuses to fake a result when no face is found", async ({ page }) => {
    const png = await samplePng(page);
    await page.goto("/try-on?style=quiff");
    await choose(page, { name: "me.png", mimeType: "image/png", buffer: png });
    await page.getByRole("button", { name: "Use This Photo" }).click();
    await page.getByLabel(/Shape guide overlay/).check();
    await page.getByRole("button", { name: "Apply Shape Guide" }).click();
    // Either the model loads and finds no face, or it cannot be downloaded — never a fake success.
    await expect(page.locator("main [role=alert]")).toContainText(/No face was detected|Could not load the on-device model/, { timeout: 30_000 });
    await expect(page.getByTestId("tryon-result")).toHaveCount(0);
  });
});
