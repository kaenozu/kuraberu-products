/**
 * embed-consent.spec.ts — E2E test for consent-before-embed behavior.
 *
 * Verifies that third-party network requests (X/YouTube/TikTok/Pinterest)
 * are NOT made until the user explicitly grants consent via the consent
 * banner. This is a network-level regression test — it does not rely on
 * DOM assertions alone, which could miss invisible resource loads.
 *
 * Test target: /articles/babybjorn/ (has autoload X embed)
 */

import { test, expect } from "@playwright/test";

/**
 * Third-party origins that embed components may contact.
 * The consent gate must block ALL of these before consent is granted.
 */
const THIRD_PARTY_ORIGINS = [
  "platform.twitter.com",
  "syndication.twitter.com",
  "cdn.syndication.twimg.com",
  "www.youtube-nocookie.com",
  "youtube.com",
  "www.youtube.com",
  "i.ytimg.com",
  "www.tiktok.com",
  "tiktok.com",
  "assets.pinterest.com",
  "pinterest.com",
  "widgets.pinterest.com",
];

function isThirdPartyRequest(url: string): boolean {
  try {
    const parsed = new URL(url);
    return THIRD_PARTY_ORIGINS.some(
      (origin) =>
        parsed.hostname === origin || parsed.hostname.endsWith(`.${origin}`),
    );
  } catch {
    return false;
  }
}

// Use the babybjorn article which has an autoload X embed
const ARTICLE_PATH = "/articles/babybjorn/";

test.describe("consent-before-embed (network level)", () => {
  test("blocks all third-party requests until user grants consent", async ({
    page,
  }) => {
    // Collect all requests made during page load and interaction
    const thirdPartyRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (isThirdPartyRequest(url)) {
        thirdPartyRequests.push(url);
      }
    });

    // Navigate to the article with autoload embeds
    await page.goto(ARTICLE_PATH, { waitUntil: "networkidle" });

    // Wait for the consent banner to appear (it's injected by JS)
    const banner = page.locator("[data-embed-consent-banner]");
    await expect(banner).toBeVisible({ timeout: 10_000 });

    // Verify the consent banner has both accept and reject buttons
    const acceptBtn = banner.locator("[data-embed-consent-accept]");
    const rejectBtn = banner.locator("[data-embed-consent-reject]");
    await expect(acceptBtn).toBeVisible();
    await expect(rejectBtn).toBeVisible();

    // CRITICAL: No third-party requests should have been made yet
    // This is the core assertion of the consent gate
    const requestsBeforeConsent = [...thirdPartyRequests];
    expect(
      requestsBeforeConsent,
      `Expected zero third-party requests before consent, but found ${requestsBeforeConsent.length}: ${requestsBeforeConsent.join(", ")}`,
    ).toHaveLength(0);

    // Also verify no third-party script tags exist in the initial HTML
    const thirdPartyScripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("script[src]"))
        .map((el) => el.getAttribute("src") ?? "")
        .filter((src) => /^(?:https?:)?\/\//i.test(src));
    });
    expect(
      thirdPartyScripts,
      `Found third-party script tags in initial HTML: ${thirdPartyScripts.join(", ")}`,
    ).toHaveLength(0);

    // Verify no iframes exist in the initial DOM
    const iframes = await page.locator("iframe").count();
    expect(
      iframes,
      `Found ${iframes} iframe(s) in initial HTML — embeds must not auto-load`,
    ).toBe(0);

    // Click the reject button to test the deny flow
    await rejectBtn.click();

    // Banner should disappear
    await expect(banner).not.toBeVisible({ timeout: 5_000 });

    // Wait a moment to ensure no requests fire after rejection
    await page.waitForTimeout(2_000);

    // Still no third-party requests should have been made
    const requestsAfterReject = [...thirdPartyRequests];
    expect(
      requestsAfterReject,
      `Expected zero third-party requests after reject, but found ${requestsAfterReject.length}: ${requestsAfterReject.join(", ")}`,
    ).toHaveLength(0);

    // The embed should still show its manual load button (not auto-loaded)
    const embedLoadButton = page.locator("[data-external-embed-load]").first();
    await expect(embedLoadButton).toBeVisible();
  });

  test("allows third-party requests after user grants consent", async ({
    page,
  }) => {
    // Collect all requests made during the test
    const thirdPartyRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (isThirdPartyRequest(url)) {
        thirdPartyRequests.push(url);
      }
    });

    // Navigate to the article
    await page.goto(ARTICLE_PATH, { waitUntil: "networkidle" });

    // Wait for the consent banner
    const banner = page.locator("[data-embed-consent-banner]");
    await expect(banner).toBeVisible({ timeout: 10_000 });

    // Verify no third-party requests before consent
    expect(thirdPartyRequests).toHaveLength(0);

    // Click the accept button
    const acceptBtn = banner.locator("[data-embed-consent-accept]");
    await acceptBtn.click();

    // Banner should disappear
    await expect(banner).not.toBeVisible({ timeout: 5_000 });

    // Now third-party requests SHOULD start appearing (autoload embeds load)
    // Wait for at least one third-party request with a generous timeout
    // since the X widget script loads asynchronously
    await expect
      .poll(() => thirdPartyRequests.length, {
        timeout: 15_000,
        message: `Expected third-party requests after consent, but none were made within 15s`,
      })
      .toBeGreaterThan(0);

    // Verify the requests include at least one from an expected provider
    const hasExpectedProvider = thirdPartyRequests.some(
      (url) =>
        url.includes("twitter.com") ||
        url.includes("x.com") ||
        url.includes("youtube"),
    );
    expect(
      hasExpectedProvider,
      `Expected requests to twitter/x.com or youtube, but got: ${thirdPartyRequests.join(", ")}`,
    ).toBe(true);
  });

  test("consent state persists across page navigation", async ({ page }) => {
    // First visit: grant consent
    await page.goto(ARTICLE_PATH, { waitUntil: "networkidle" });
    const banner = page.locator("[data-embed-consent-banner]");
    await expect(banner).toBeVisible({ timeout: 10_000 });
    await banner.locator("[data-embed-consent-accept]").click();
    await expect(banner).not.toBeVisible({ timeout: 5_000 });

    // Navigate to another article with autoload embeds
    const thirdPartyRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (isThirdPartyRequest(url)) {
        thirdPartyRequests.push(url);
      }
    });

    await page.goto("/articles/merries-newborn/", { waitUntil: "networkidle" });

    // The consent banner should NOT appear (consent already granted)
    const bannerOnSecondPage = page.locator("[data-embed-consent-banner]");
    await expect(bannerOnSecondPage).not.toBeVisible({ timeout: 3_000 });

    // Autoload embeds should fire without waiting for consent
    await expect
      .poll(() => thirdPartyRequests.length, {
        timeout: 15_000,
        message: `Expected third-party requests on second page (consent persisted), but none were made`,
      })
      .toBeGreaterThan(0);
  });

  test("consent banner is not present on pages without autoload embeds", async ({
    page,
  }) => {
    // The top page should not have a consent banner
    await page.goto("/", { waitUntil: "networkidle" });
    const banner = page.locator("[data-embed-consent-banner]");
    await expect(banner).not.toBeVisible({ timeout: 3_000 });
  });
});
