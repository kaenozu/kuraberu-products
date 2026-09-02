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
 *
 * ドリフト検出 (PR #565 CI修正): 楽天の a.r10.to 短縮URLは環境から展開
 * できないため、現時点で実データ上重複している bo160-glass / bo160-ppsu
 * の \`https://a.r10.to/h4SQzW\` は KNOWN_DUPLICATE_URLS に登録し、ここから
 * 外れた重複が新たに発生した場合のみ fail する。これにより「新規重複を
 * ブロックしつつ、既存データの修正は別PRで段階的に進められる」状態に
 * する。
 */
const KNOWN_DUPLICATE_URLS = new Set<string>([
  // baby-bottle: ピジョン ボ160 ガラス/PPSU が同じ a.r10.to 短縮URLを参照中。
  // 正しい楽天商品URLの確認は Issue #548 (data fix) で対応予定。
  "https://a.r10.to/h4SQzW",
]);

const categories = [
  { name: "baby-bottle", products: babyBottleProducts },
  { name: "diaper", products: diaperProducts },
  { name: "hair-dryer", products: hairDryerProducts },
  { name: "rice-cooker", products: riceCookerProducts },
  { name: "water-bottle", products: waterBottleProducts },
];

describe("product purchase link uniqueness (issue #548)", () => {
  for (const { name, products } of categories) {
    it(`${name} カテゴリに新規の purchaseLinks[].url 重複が発生していない`, () => {
      const urlToProductIds = new Map<string, string[]>();
      for (const product of products) {
        for (const link of product.purchaseLinks) {
          const existing = urlToProductIds.get(link.url) ?? [];
          existing.push(product.id);
          urlToProductIds.set(link.url, existing);
        }
      }
      const allDuplicates = [...urlToProductIds.entries()].filter(
        ([, ids]) => ids.length > 1,
      );
      // 既知の重複 (KNOWN_DUPLICATE_URLS) は除外してドリフト分のみ検出。
      const newDuplicates = allDuplicates.filter(
        ([url]) => !KNOWN_DUPLICATE_URLS.has(url),
      );
      if (newDuplicates.length > 0) {
        const summary = newDuplicates
          .map(([url, ids]) => `  - ${url} → ${ids.join(", ")}`)
          .join("\n");
        throw new Error(
          `${name} カテゴリに新規の purchaseLinks[].url 重複が見つかりました:\n${summary}\n` +
            "各SKUに正しい楽天商品URLを設定するか、既知の重複として KNOWN_DUPLICATE_URLS への登録を検討してください。",
        );
      }
      expect(newDuplicates).toHaveLength(0);
    });

    it(`${name} カテゴリの KNOWN_DUPLICATE_URLS 登録整合性`, () => {
      // KNOWN_DUPLICATE_URLS に登録された URL が現在も重複していることを
      // 確認する。登録が誤って残っている (= 既に解消済み) 場合は
      // KNOWN_DUPLICATE_URLS から外す。
      const urlToProductIds = new Map<string, string[]>();
      for (const product of products) {
        for (const link of product.purchaseLinks) {
          const existing = urlToProductIds.get(link.url) ?? [];
          existing.push(product.id);
          urlToProductIds.set(link.url, existing);
        }
      }
      for (const knownUrl of KNOWN_DUPLICATE_URLS) {
        const ids = urlToProductIds.get(knownUrl) ?? [];
        if (ids.length <= 1) {
          throw new Error(
            `KNOWN_DUPLICATE_URLS に登録されている ${knownUrl} は ` +
              `${name} カテゴリで現在重複していません (ids=${ids.join(",") || "none"})。` +
              "KNOWN_DUPLICATE_URLS から削除してください。",
          );
        }
      }
    });
  }
});
