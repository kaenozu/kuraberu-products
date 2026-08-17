import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { articleMetadata } from "../src/content/articles";
import {
  ARTICLE_LAYOUT,
  expectedPurchaseCtasPerArticle,
} from "../config/article-layout.mjs";

// 記事 astro から <PurchaseCard ... /> のブロックを抽出する。
// コンポーネントの import 行（<PurchaseCard を含まない）は対象外。
function purchaseCardBlocks(source: string): string[] {
  return [...source.matchAll(/<PurchaseCard\b[\s\S]*?\/>/g)].map(
    ([block]) => block,
  );
}

const commercialArticleTemplate = readFileSync(
  "src/components/CommercialArticlePage.astro",
  "utf8",
);

describe("article CTA layout vs metadata productCount", () => {
  it("keeps per-placement PurchaseCard counts consistent with productCount and midArticleCta", () => {
    for (const article of articleMetadata) {
      const source = readFileSync(
        join("src/pages/articles", article.id, "index.astro"),
        "utf8",
      );
      const blocks = purchaseCardBlocks(
        source.includes("CommercialArticlePage")
          ? commercialArticleTemplate
          : source,
      );
      const midArticleCta = article.midArticleCta === true;

      const counts = new Map<string, number>();
      for (const block of blocks) {
        // placement 未指定は config の defaultPlacement（article-end）として扱う
        const placement =
          block.match(/\bplacement="([^"]+)"/)?.[1] ??
          ARTICLE_LAYOUT.defaultPlacement;
        expect(
          ARTICLE_LAYOUT.placements,
          `${article.id}: unrecognized placement ${placement}`,
        ).toContain(placement);
        counts.set(placement, (counts.get(placement) ?? 0) + 1);
      }

      // v3: 末尾セットは常に商品数分
      for (const set of ARTICLE_LAYOUT.ctaSets) {
        const expected = set.cardsPerProduct * article.productCount;
        expect(
          counts.get(set.placement) ?? 0,
          `${article.id}: ${set.placement} should have ${expected} cards`,
        ).toBe(expected);
      }

      // v3: 途中 CTA（after-decision）は長文記事（midArticleCta）だけ商品数分
      const midSet = ARTICLE_LAYOUT.midArticleSet;
      const expectedMid = midArticleCta
        ? midSet.cardsPerProduct * article.productCount
        : 0;
      expect(
        counts.get(midSet.placement) ?? 0,
        `${article.id}: ${midSet.placement} should have ${expectedMid} cards (midArticleCta=${midArticleCta})`,
      ).toBe(expectedMid);

      // 総枚数 = 期待 CTA 総数（productCount と midArticleCta から導出）
      expect(
        blocks.length,
        `${article.id}: total cards should match expectedPurchaseCtasPerArticle(${article.productCount}, layout, { midArticleCta })`,
      ).toBe(
        expectedPurchaseCtasPerArticle(article.productCount, ARTICLE_LAYOUT, {
          midArticleCta,
        }),
      );
    }
  });

  it("finds PurchaseCard blocks for every article", () => {
    for (const article of articleMetadata) {
      const source = readFileSync(
        join("src/pages/articles", article.id, "index.astro"),
        "utf8",
      );
      expect(
        purchaseCardBlocks(
          source.includes("CommercialArticlePage")
            ? commercialArticleTemplate
            : source,
        ).length,
        `${article.id}: must render at least one PurchaseCard`,
      ).toBeGreaterThan(0);
    }
  });
});
