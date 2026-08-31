import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { articleMetadata } from "../src/content/articles";
import {
  ARTICLE_LAYOUT,
  contentTypeFor,
  expectedPurchaseCtasPerArticle,
} from "../config/article-layout.mjs";

function purchaseCardBlocks(source: string): string[] {
  return [...source.matchAll(/<PurchaseCard\b[\s\S]*?\/>/g)].map(
    ([block]) => block,
  );
}

const templates: Record<string, string> = {
  CommercialArticlePage: readFileSync(
    "src/components/CommercialArticlePage.astro",
    "utf8",
  ),
  ArticleComparisonPage: readFileSync(
    "src/components/ArticleComparisonPage.astro",
    "utf8",
  ),
};

function templateFor(source: string): string {
  for (const [key, tmpl] of Object.entries(templates)) {
    if (source.includes(key)) return tmpl;
  }
  return source;
}

describe("article CTA layout vs metadata productCount", () => {
  // dist の生成HTMLと突合するため、astro build 後のみ実行
  const distRenderedHtmlAvailable = existsSync(
    join("dist/articles", articleMetadata[0]?.id ?? "", "index.html"),
  );

  it.skipIf(!distRenderedHtmlAvailable)(
    "keeps per-placement PurchaseCard counts consistent with productCount",
    () => {
      for (const article of articleMetadata) {
        const source = readFileSync(
          join("src/pages/articles", article.id, "index.astro"),
          "utf8",
        );
        const blocks = purchaseCardBlocks(templateFor(source));
        const renderedHtml = readFileSync(
          join("dist/articles", article.id, "index.html"),
          "utf8",
        );
        const nextStepBuyCount = (
          renderedHtml.match(
            /<a\b[^>]*class="[^"]*\bnext-step__buy\b[^"]*"[^>]*>/gi,
          ) ?? []
        ).length;

        // 全記事がアフィリエイトリンクを表示するようになったため、
        // purchaseLinkStatus に関わらず検証を実行する。
        const counts = new Map<string, number>();
        for (const block of blocks) {
          const placement =
            block.match(/\bplacement="([^"]+)"/)?.[1] ??
            ARTICLE_LAYOUT.defaultPlacement;
          expect(
            ARTICLE_LAYOUT.placements,
            `${article.id}: unrecognized placement ${placement}`,
          ).toContain(placement);
          counts.set(placement, (counts.get(placement) ?? 0) + 1);
        }

        for (const block of blocks) {
          expect(
            block,
            `${article.id}: article must pass purchaseLinkStatus to every PurchaseCard`,
          ).toMatch(/\bpurchaseLinkStatus=/);
        }

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

        expect(
          blocks.length + nextStepBuyCount,
          `${article.id}: total CTAs should match expectedPurchaseCtasPerArticle(${article.productCount}, layout)`,
        ).toBe(
          expectedPurchaseCtasPerArticle(
            article.productCount,
            ARTICLE_LAYOUT,
          ),
        );
      }
    },
  );

  it("finds PurchaseCard blocks for every article", () => {
    for (const article of articleMetadata) {
      const source = readFileSync(
        join("src/pages/articles", article.id, "index.astro"),
        "utf8",
      );
      expect(
        purchaseCardBlocks(templateFor(source)).length,
        `${article.id}: must render at least one PurchaseCard`,
      ).toBeGreaterThan(0);
    }
  });
});
