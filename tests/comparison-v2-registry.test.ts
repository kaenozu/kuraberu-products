import { describe, expect, it } from "vitest";
import {
  articlePurchaseLinks,
  type ArticlePurchaseLink,
} from "../src/lib/products";
import { articleMetadata } from "../src/content/articles";
import { comparisonV2 } from "../src/content/articles/comparison-v2";

const purchaseLinkTable = articlePurchaseLinks as Record<
  string,
  ArticlePurchaseLink
>;

/**
 * comparison-v2 レジストリ（ArticleComparisonV2ById のデータ源）の契約。
 *
 * - キーはモノリス articles.ts に存在する記事IDであること
 * - purchaseHrefs は articlePurchaseLinks の "<articleId>:left|right" から
 *   解決済みであること
 * - officialHref はメーカー公式ページであり、アフィリエイト短縮リンクで
 *   ないこと（公式・広告の分離。ページ側リテラルとの一致は各ソース検査と
 *   ページ先頭コメントの運用ルールに委ねる）
 */
describe("comparison-v2 registry", () => {
  it("covers only known article ids", () => {
    const known = new Set(articleMetadata.map((article) => article.id));
    for (const entry of Object.values(comparisonV2)) {
      expect(
        known.has(entry.articleId),
        `${entry.articleId}: unknown article id`,
      ).toBe(true);
    }
  });

  it("resolves purchaseHrefs from articlePurchaseLinks", () => {
    for (const entry of Object.values(comparisonV2)) {
      expect(entry.purchaseHrefs.left).toBe(
        purchaseLinkTable[`${entry.articleId}:left`].purchaseUrl,
      );
      expect(entry.purchaseHrefs.right).toBe(
        purchaseLinkTable[`${entry.articleId}:right`].purchaseUrl,
      );
    }
  });

  it("points officialHref at manufacturer pages, not affiliate links", () => {
    const affiliateLike = /(a\.r10\.to|hb\.afl\.rakuten\.co\.jp)/;
    for (const entry of Object.values(comparisonV2)) {
      for (const side of ["left", "right"] as const) {
        const href = entry[side].officialHref;
        expect(href.startsWith("https://"), `${entry.articleId}:${side}`).toBe(
          true,
        );
        expect(
          affiliateLike.test(href),
          `${entry.articleId}:${side}: officialHref must not be an affiliate link`,
        ).toBe(false);
      }
    }
  });

  it("carries rows and guide points for both sides", () => {
    for (const entry of Object.values(comparisonV2)) {
      expect(entry.rows.length).toBeGreaterThan(0);
      expect(entry.left.guidePoints.length).toBeGreaterThan(0);
      expect(entry.right.guidePoints.length).toBeGreaterThan(0);
      expect(entry.checkedAt).toBeDefined();
    }
  });
});
