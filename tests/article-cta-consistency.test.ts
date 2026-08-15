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

describe("article CTA layout vs metadata productCount", () => {
  it("keeps per-placement PurchaseCard counts consistent with productCount", () => {
    for (const article of articleMetadata) {
      const source = readFileSync(
        join("src/pages/articles", article.id, "index.astro"),
        "utf8",
      );
      const blocks = purchaseCardBlocks(source);

      const counts = new Map<string, number>();
      for (const block of blocks) {
        // placement 未指定は config の defaultPlacement（after-decision）として扱う
        const placement =
          block.match(/\bplacement="([^"]+)"/)?.[1] ??
          ARTICLE_LAYOUT.defaultPlacement;
        expect(
          ARTICLE_LAYOUT.placements,
          `${article.id}: unrecognized placement ${placement}`,
        ).toContain(placement);
        counts.set(placement, (counts.get(placement) ?? 0) + 1);
      }

      // 配置ごとの枚数 = cardsPerProduct × productCount（config の唯一の契約）
      for (const set of ARTICLE_LAYOUT.ctaSets) {
        const expected = set.cardsPerProduct * article.productCount;
        expect(
          counts.get(set.placement) ?? 0,
          `${article.id}: ${set.placement} should have ${expected} cards`,
        ).toBe(expected);
      }

      // 総枚数 = 期待 CTA 総数（メタデータの productCount から導出）
      expect(
        blocks.length,
        `${article.id}: total cards should match expectedPurchaseCtasPerArticle(${article.productCount})`,
      ).toBe(expectedPurchaseCtasPerArticle(article.productCount));
    }
  });

  it("finds PurchaseCard blocks for every article", () => {
    for (const article of articleMetadata) {
      const source = readFileSync(
        join("src/pages/articles", article.id, "index.astro"),
        "utf8",
      );
      expect(
        purchaseCardBlocks(source).length,
        `${article.id}: must render at least one PurchaseCard`,
      ).toBeGreaterThan(0);
    }
  });
});
