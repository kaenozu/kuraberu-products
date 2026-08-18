/**
 * 炊飯器（タイガー 圧力IH 5.5合）カテゴリの商品データ。
 *
 * 数値・属性の根拠は、タイガー公式の商品ページのみ。
 * 確認日とソースを保持し、未確認のスペックや推測値は入れない。
 *
 * 対象: タイガー JPV-L100 / JPV-M100
 * 注意: 今回確認した5.5合モデルは、容量・サイズ・質量が同一。差があるのは
 * 公式でのモデル位置づけ（上位/エントリー）と公式オンライン価格のみ。
 */

import type { Product } from "../../domain/diagnosis/types";

const L100_OFFICIAL =
  "https://www.tiger-corporation.com/ja/jpn/product/rice-cooker/jpv-l/";
const M100_OFFICIAL =
  "https://www.tiger-corporation.com/ja/jpn/product/rice-cooker/jpv-m/";

function source(
  label: string,
  url: string,
  checkedAt: string,
): Product["sources"][number] {
  return { label, url, checkedAt };
}

export const tigerJpvL100: Product = {
  id: "tiger-jpv-l100",
  categoryId: "rice-cooker",
  brand: "タイガー",
  name: "タイガー 圧力IHジャー炊飯器 JPV-L100",
  tags: ["rice_cooker", "premium_model", "pressure_ih"],
  attributes: {
    capacityGo: 5.5,
    positioning: "premium",
    priceOfficialYen: 57800,
    weightKg: 5.4,
  },
  articleUrls: [
    "/articles/tiger-jpv-l100-vs-jpv-m100/",
    "/articles/tiger-jpv-l100-vs-zojirushi-nw-fc10/",
  ],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: "https://a.r10.to/hYk0zA",
      affiliate: true,
    },
  ],
  sources: [source("タイガー公式 商品ページ", L100_OFFICIAL, "2026-08-13")],
  verifiedAt: "2026-08-13",
};

export const tigerJpvM100: Product = {
  id: "tiger-jpv-m100",
  categoryId: "rice-cooker",
  brand: "タイガー",
  name: "タイガー 圧力IHジャー炊飯器 JPV-M100",
  tags: ["rice_cooker", "entry_model", "pressure_ih"],
  attributes: {
    capacityGo: 5.5,
    positioning: "entry",
    priceOfficialYen: 49800,
    weightKg: 5.4,
  },
  articleUrls: ["/articles/tiger-jpv-l100-vs-jpv-m100/"],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: "https://a.r10.to/hPCd5O",
      affiliate: true,
    },
  ],
  sources: [source("タイガー公式 商品ページ", M100_OFFICIAL, "2026-08-13")],
  verifiedAt: "2026-08-13",
};

export const riceCookerProducts: readonly Product[] = [
  tigerJpvL100,
  tigerJpvM100,
];
