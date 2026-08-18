import { describe, expect, it } from "vitest";
import {
  ARTICLE_LAYOUT,
  contentTypeFor,
  expectedPlacementCounts,
  expectedPurchaseCtasPerArticle,
} from "../config/article-layout.mjs";

describe("article layout config", () => {
  it("defines the v3 layout as one article-end set plus the next-step block", () => {
    // v3 原則: 購入カードは末尾 1 セットのみ（v2 の途中 CTA = after-decision は 2026-08-18 に削除）。
    // 結論直後の next-step は比較記事のみ（comparisonOnly）。
    expect(ARTICLE_LAYOUT.ctaSets).toEqual([
      { placement: "article-end", cardsPerProduct: 1 },
      { placement: "next-step", cardsPerProduct: 1, comparisonOnly: true },
    ]);
    expect(ARTICLE_LAYOUT.defaultPlacement).toBe("article-end");
    expect(ARTICLE_LAYOUT.placements).not.toContain("after-decision");
    expect(ARTICLE_LAYOUT.placements).toContain("article-end");
    expect(ARTICLE_LAYOUT.placements).toContain("next-step");
  });

  it("derives the expected CTA count from the product count", () => {
    // 比較記事（2商品）: 末尾1×2 + next-step1×2 = 4
    expect(expectedPurchaseCtasPerArticle(2)).toBe(4);
    // 単一商品記事: 末尾1×1 = 1（next-step は比較記事のみ）
    expect(expectedPurchaseCtasPerArticle(1)).toBe(1);
  });

  it("derives per-placement counts for the gate", () => {
    expect(expectedPlacementCounts(2)).toEqual({
      "article-end": 2,
      "next-step": 2,
    });
    expect(expectedPlacementCounts(1)).toEqual({ "article-end": 1 });
  });

  it("rejects a non-positive product count", () => {
    expect(() => expectedPurchaseCtasPerArticle(0)).toThrow();
    expect(() => expectedPurchaseCtasPerArticle(-1)).toThrow();
    expect(() => expectedPurchaseCtasPerArticle(1.5)).toThrow();
    expect(() => expectedPurchaseCtasPerArticle(NaN)).toThrow();
    expect(() => expectedPlacementCounts(0)).toThrow();
  });

  it("derives a larger count when the layout gains another set", () => {
    const extendedLayout = {
      ...ARTICLE_LAYOUT,
      ctaSets: [
        { placement: "article-end", cardsPerProduct: 1 },
        { placement: "article-end", cardsPerProduct: 1 },
      ],
    };
    expect(expectedPurchaseCtasPerArticle(2, extendedLayout)).toBe(4);
    expect(expectedPurchaseCtasPerArticle(1, extendedLayout)).toBe(2);
  });

  it("keeps every ctaSet placement and the default placement inside the allowed placements", () => {
    for (const set of ARTICLE_LAYOUT.ctaSets) {
      expect(ARTICLE_LAYOUT.placements).toContain(set.placement);
    }
    expect(ARTICLE_LAYOUT.placements).toContain(
      ARTICLE_LAYOUT.defaultPlacement,
    );
  });

  it("has a non-empty CTA marker and at least one positive-card set", () => {
    expect(ARTICLE_LAYOUT.ctaEvent.length).toBeGreaterThan(0);
    expect(ARTICLE_LAYOUT.ctaSets.length).toBeGreaterThan(0);
    expect(ARTICLE_LAYOUT.ctaSets.every((set) => set.cardsPerProduct > 0)).toBe(
      true,
    );
  });

  it("derives the content type from the product count", () => {
    // 単一商品記事（productCount = 1）＝ 商品ガイド
    expect(contentTypeFor(1)).toBe("guide");
    expect(ARTICLE_LAYOUT.contentTypes.guide.label).toBe("商品ガイド");
    // 複数商品比較（productCount >= 2）＝ 比較記事
    expect(contentTypeFor(2)).toBe("comparison");
    expect(contentTypeFor(3)).toBe("comparison");
    expect(ARTICLE_LAYOUT.contentTypes.comparison.label).toBe("比較記事");
    // 商品ガイドは productCount 1 のみに限定される
    expect(ARTICLE_LAYOUT.contentTypes.guide.maxProductCount).toBe(1);
    expect(ARTICLE_LAYOUT.contentTypes.comparison.minProductCount).toBe(2);
  });

  it("rejects a non-positive product count for the content type", () => {
    expect(() => contentTypeFor(0)).toThrow();
    expect(() => contentTypeFor(-1)).toThrow();
    expect(() => contentTypeFor(1.5)).toThrow();
    expect(() => contentTypeFor(NaN)).toThrow();
  });
});
