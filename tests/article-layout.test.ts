import { describe, expect, it } from "vitest";
import {
  ARTICLE_LAYOUT,
  contentTypeFor,
  expectedPlacementCounts,
  expectedPurchaseCtasPerArticle,
} from "../config/article-layout.mjs";

describe("article layout config", () => {
  it("defines the v3 layout as one article-end set plus an optional long-article mid set", () => {
    // v3 原則: 購入カードは末尾 1 セット。途中（after-decision）は長文記事のみ。
    expect(ARTICLE_LAYOUT.ctaSets).toEqual([
      { placement: "article-end", cardsPerProduct: 1 },
    ]);
    expect(ARTICLE_LAYOUT.midArticleSet).toEqual({
      placement: "after-decision",
      cardsPerProduct: 1,
    });
    expect(ARTICLE_LAYOUT.defaultPlacement).toBe("article-end");
    expect(ARTICLE_LAYOUT.placements).toContain("after-decision");
    expect(ARTICLE_LAYOUT.placements).toContain("article-end");
  });

  it("derives the expected CTA count from the product count and long-article flag", () => {
    // 通常の比較記事（2商品）: 末尾1×2 = 2
    expect(expectedPurchaseCtasPerArticle(2)).toBe(2);
    // 通常の単一商品記事: 末尾1×1 = 1
    expect(expectedPurchaseCtasPerArticle(1)).toBe(1);
    // 長文の比較記事: 末尾2 + 途中1×2 = 4
    expect(
      expectedPurchaseCtasPerArticle(2, ARTICLE_LAYOUT, {
        midArticleCta: true,
      }),
    ).toBe(4);
    // 長文の単一商品記事: 末尾1 + 途中1 = 2
    expect(
      expectedPurchaseCtasPerArticle(1, ARTICLE_LAYOUT, {
        midArticleCta: true,
      }),
    ).toBe(2);
  });

  it("derives per-placement counts for the gate", () => {
    expect(expectedPlacementCounts(2)).toEqual({ "article-end": 2 });
    expect(expectedPlacementCounts(1)).toEqual({ "article-end": 1 });
    expect(
      expectedPlacementCounts(2, ARTICLE_LAYOUT, { midArticleCta: true }),
    ).toEqual({ "article-end": 2, "after-decision": 2 });
    expect(
      expectedPlacementCounts(1, ARTICLE_LAYOUT, { midArticleCta: true }),
    ).toEqual({ "article-end": 1, "after-decision": 1 });
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

  it("keeps every ctaSet placement and the mid set inside the allowed placements", () => {
    for (const set of ARTICLE_LAYOUT.ctaSets) {
      expect(ARTICLE_LAYOUT.placements).toContain(set.placement);
    }
    expect(ARTICLE_LAYOUT.placements).toContain(
      ARTICLE_LAYOUT.midArticleSet.placement,
    );
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
    expect(ARTICLE_LAYOUT.midArticleSet.cardsPerProduct).toBeGreaterThan(0);
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
