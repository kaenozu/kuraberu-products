import { describe, expect, it } from "vitest";
import {
  ARTICLE_LAYOUT,
  expectedPurchaseCtasPerArticle,
} from "../config/article-layout.mjs";

describe("article layout config", () => {
  it("defines the standard layout as after-decision and article-end sets of two CTAs each", () => {
    expect(ARTICLE_LAYOUT.ctaSets).toEqual([
      { placement: "after-decision", cards: 2 },
      { placement: "article-end", cards: 2 },
    ]);
  });

  it("derives the expected purchase CTA count from ctaSets", () => {
    expect(expectedPurchaseCtasPerArticle()).toBe(4);
  });

  it("derives a larger count when the layout gains another set", () => {
    const extendedLayout = {
      ...ARTICLE_LAYOUT,
      ctaSets: [
        { placement: "after-decision", cards: 2 },
        { placement: "article-end", cards: 2 },
        { placement: "article-end", cards: 2 },
      ],
    };
    expect(expectedPurchaseCtasPerArticle(extendedLayout)).toBe(6);
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
    expect(ARTICLE_LAYOUT.ctaSets.every((set) => set.cards > 0)).toBe(true);
  });
});
