import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pampersNewbornArticle } from "../src/content/articles";
import { daysSinceCheck, isContentStale } from "../src/lib/content-freshness";

describe("content freshness", () => {
  it("uses calendar dates without negative ages", () => {
    expect(daysSinceCheck("2026-07-31", "2026-08-05")).toBe(5);
    expect(daysSinceCheck("2026-08-05", "2026-07-31")).toBe(0);
  });

  it("treats missing and old checks as stale", () => {
    expect(isContentStale(undefined, "2026-08-05")).toBe(true);
    expect(isContentStale("2026-01-01", "2026-08-05", 180)).toBe(true);
    expect(isContentStale("2026-07-31", "2026-08-05", 180)).toBe(false);
  });

  it("does not fabricate a purchase-link check date", () => {
    expect(pampersNewbornArticle.productInfoCheckedAt).toBe("2026-07-31");
    expect(pampersNewbornArticle.purchaseLinkStatus).toBe("unverified");
    expect(pampersNewbornArticle.purchaseLinksCheckedAt).toBeUndefined();
  });

  it("renders factual check dates and update history", () => {
    const html = readFileSync(
      "dist/articles/pampers-newborn/index.html",
      "utf8",
    );
    expect(html).toContain("商品情報確認日：");
    expect(html).toContain('datetime="2026-07-31"');
    expect(html).not.toContain("最終確認日は未記録");
    expect(html).not.toContain("購入リンク：未確認");
    expect(html).toContain("更新履歴");
    expect(html).toContain("メーカー公式の商品機能とサイズ情報を確認");
    expect(html).toContain("価格や在庫を保証しません");
  });
});
