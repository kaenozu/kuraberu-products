import { describe, expect, it } from "vitest";
import {
  ARTICLE_LAYOUT,
  expectedPurchaseCtasPerArticle,
} from "../config/article-layout.mjs";

describe("article layout config", () => {
  it("defines the standard layout as after-decision and article-end sets of one card per product", () => {
    expect(ARTICLE_LAYOUT.ctaSets).toEqual([
      { placement: "after-decision", cardsPerProduct: 1 },
      { placement: "article-end", cardsPerProduct: 1 },
    ]);
  });

  it("derives the expected CTA count from the article product count", () => {
    // 比較記事（2商品）: 1×2 + 1×2 = 4
    expect(expectedPurchaseCtasPerArticle(2)).toBe(4);
    // 単一商品記事（1商品）: 1×1 + 1×1 = 2
    expect(expectedPurchaseCtasPerArticle(1)).toBe(2);
  });

  it("rejects a non-positive product count", () => {
    expect(() => expectedPurchaseCtasPerArticle(0)).toThrow();
    expect(() => expectedPurchaseCtasPerArticle(-1)).toThrow();
    expect(() => expectedPurchaseCtasPerArticle(1.5)).toThrow();
    expect(() => expectedPurchaseCtasPerArticle(NaN)).toThrow();
  });

  it("derives a larger count when the layout gains another set", () => {
    const extendedLayout = {
      ...ARTICLE_LAYOUT,
      ctaSets: [
        { placement: "after-decision", cardsPerProduct: 1 },
        { placement: "article-end", cardsPerProduct: 1 },
        { placement: "article-end", cardsPerProduct: 1 },
      ],
    };
    expect(expectedPurchaseCtasPerArticle(2, extendedLayout)).toBe(6);
    expect(expectedPurchaseCtasPerArticle(1, extendedLayout)).toBe(3);
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
});
