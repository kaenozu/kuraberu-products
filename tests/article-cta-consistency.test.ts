import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { articleMetadata } from "../src/content/articles";
import {
  ARTICLE_LAYOUT,
  contentTypeFor,
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
  it("keeps per-placement PurchaseCard counts consistent with productCount", () => {
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
      // 結論直後の next-step ブロックの購入ボタン数（レンダリング済み HTML から）。
      // comparisonOnly セットの照合と総数チェックの両方で使う。
      const renderedHtml = readFileSync(
        join("dist/articles", article.id, "index.html"),
        "utf8",
      );
      const nextStepBuyCount = (
        renderedHtml.match(
          /<a\b[^>]*class="[^"]*\bnext-step__buy\b[^"]*"[^>]*>/gi,
        ) ?? []
      ).length;

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

      // v3: 末尾セットは常に商品数分。
      // next-step（comparisonOnly）は PurchaseCard ではなく NextStepBlock が描画する
      // （比較記事の結論直後ブロック）ため、レンダリング済み HTML の
      // next-step__buy ボタン数を照合する。
      for (const set of ARTICLE_LAYOUT.ctaSets) {
        const isComparison =
          contentTypeFor(article.productCount) === "comparison";
        const expected =
          set.comparisonOnly && !isComparison
            ? 0
            : set.cardsPerProduct * article.productCount;
        if (set.comparisonOnly) {
          expect(
            nextStepBuyCount,
            `${article.id}: ${set.placement} should have ${expected} buy buttons (NextStepBlock)`,
          ).toBe(expected);
        } else {
          expect(
            counts.get(set.placement) ?? 0,
            `${article.id}: ${set.placement} should have ${expected} cards`,
          ).toBe(expected);
        }
      }

      // 総枚数 = PurchaseCard 数 + next-step ボタン数 = 期待 CTA 総数
      // （productCount から導出）
      expect(
        blocks.length + nextStepBuyCount,
        `${article.id}: total CTAs should match expectedPurchaseCtasPerArticle(${article.productCount}, layout)`,
      ).toBe(
        expectedPurchaseCtasPerArticle(article.productCount, ARTICLE_LAYOUT),
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
