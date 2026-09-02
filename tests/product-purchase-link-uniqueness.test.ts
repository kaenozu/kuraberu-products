import { describe, expect, it } from "vitest";
import { babyBottleProducts } from "../src/data/products/baby-bottles";
import { diaperProducts } from "../src/data/products/diapers";
import { hairDryerProducts } from "../src/data/products/hair-dryers";
import { riceCookerProducts } from "../src/data/products/rice-cookers";
import { waterBottleProducts } from "../src/data/products/water-bottles";

/**
 * Issue #548: 同一カテゴリ内で複数商品が同じ purchaseLinks[].url を共有すると、
 * クリック時に別SKUへ遷移する。アフィリエイト成果の不正確な計測と比較記事の
 * 信頼性低下を招くため、ソースデータで重複がないことを静的検証する。
 *
 * 注: 楽天 a.r10.to 短縮URLは展開が必要なため、ソース内で重複しているかを
 * 文字列レベルで確認する。短縮URLの最終的な遷移先検証は別工程で実施する。
 */
const categories = [
  { name: "baby-bottle", products: babyBottleProducts },
  { name: "diaper", products: diaperProducts },
  { name: "hair-dryer", products: hairDryerProducts },
  { name: "rice-cooker", products: riceCookerProducts },
  { name: "water-bottle", products: waterBottleProducts },
];

describe("product purchase link uniqueness (issue #548)", () => {
  for (const { name, products } of categories) {
    it(`${name} カテゴリの purchaseLinks[].url に重複がない`, () => {
      const urlToProductIds = new Map<string, string[]>();
      for (const product of products) {
        for (const link of product.purchaseLinks) {
          const existing = urlToProductIds.get(link.url) ?? [];
          existing.push(product.id);
          urlToProductIds.set(link.url, existing);
        }
      }
      const duplicates = [...urlToProductIds.entries()].filter(
        ([, ids]) => ids.length > 1,
      );
      if (duplicates.length > 0) {
        const summary = duplicates
          .map(([url, ids]) => `  - ${url} → ${ids.join(", ")}`)
          .join("\n");
        throw new Error(
          `${name} カテゴリで purchaseLinks[].url が重複しています:\n${summary}\n` +
            "各SKUに正しい楽天商品URLを設定してください。",
        );
      }
      expect(duplicates).toHaveLength(0);
    });
  }
});
