/**
 * unverified-cta.e2e.ts — E2E test for the purchase-CTA fail-closed contract.
 *
 * - unverified の記事では購入ボタン (a.next-step__buy) を出さず、
 *   「購入先の確認中です」表示に倒すこと（実ブラウザでの確認）。
 * - verified の記事では購入ボタンが2件出ること（対照実験）。
 * - モバイル幅 (390px) では横スクロールが発生せず、購入ボタンが
 *   タップしやすい大きさを保つこと。
 *
 * Test targets:
 * - /articles/thermos-kfm-020-vs-kfi-020/ (purchaseLinkStatus: unverified)
 * - /articles/pampers-newborn/ (purchaseLinkStatus: verified)
 */

import { test, expect } from "@playwright/test";

const UNVERIFIED_PATH = "/articles/thermos-kfm-020-vs-kfi-020/";
const VERIFIED_PATH = "/articles/pampers-newborn/";
const NOTICE_TEXT = "購入先の確認中です";

test.describe("unverified purchase CTA (desktop)", () => {
  test("shows no purchase buttons and falls back to notice text", async ({
    page,
  }) => {
    await page.goto(UNVERIFIED_PATH);
    await expect(page.locator("[data-next-step]")).toBeVisible();

    await expect(page.locator("a.next-step__buy")).toHaveCount(0);
    const missing = page.locator(".next-step__buy--missing");
    await expect(missing).toHaveCount(2);
    for (const element of await missing.all()) {
      await expect(element).toContainText(NOTICE_TEXT);
    }
  });

  test("shows two purchase buttons on a verified article", async ({ page }) => {
    await page.goto(VERIFIED_PATH);
    const buttons = page.locator("a.next-step__buy");
    await expect(buttons).toHaveCount(2);
    for (const element of await buttons.all()) {
      await expect(element).toHaveAttribute("target", "_blank");
      const rel = (await element.getAttribute("rel")) ?? "";
      expect(rel).toContain("noopener");
    }
  });
});

test.describe("purchase CTA on mobile width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("causes no horizontal overflow on article pages", async ({ page }) => {
    for (const path of [UNVERIFIED_PATH, VERIFIED_PATH]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
    }
  });

  test("keeps verified purchase buttons tappable at 390px", async ({
    page,
  }) => {
    await page.goto(VERIFIED_PATH);
    const buttons = page.locator("a.next-step__buy");
    await expect(buttons).toHaveCount(2);
    for (const element of await buttons.all()) {
      const box = await element.boundingBox();
      expect(box, "purchase button must be visible").not.toBeNull();
      // 44px 以上をタップ領域の最低線とする（実装は min-height: 64px）。
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThan(200);
    }
  });
});
