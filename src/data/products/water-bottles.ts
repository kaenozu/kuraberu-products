/**
 * 水筒（0.5L ワンタッチ式）カテゴリの商品データ。
 *
 * 数値・属性の根拠は、サーモス・タイガー各公式の商品ページのみ。
 * 確認日とソースを保持し、未確認のスペックや推測値は入れない。
 *
 * 対象: サーモス JNL-S500 / タイガー MTA-J050
 */

import type { Product } from "../../domain/diagnosis/types";

const THERMOS_OFFICIAL = "https://www.thermos.jp/product/series/jnl-s00.html";
const TIGER_OFFICIAL =
  "https://www.tiger-corporation.com/ja/jpn/product/vacuum-insulated-products/mta-j/";

function source(
  label: string,
  url: string,
  checkedAt: string,
): Product["sources"][number] {
  return { label, url, checkedAt };
}

export const thermosJnlS500: Product = {
  id: "thermos-jnl-s500",
  categoryId: "water-bottle",
  brand: "サーモス",
  name: "サーモス 真空断熱ケータイマグ JNL-S500",
  tags: ["water_bottle", "light", "dishwasher_safe", "many_colors"],
  attributes: {
    capacityL: 0.5,
    weightKg: 0.2,
    coldEfficiencyC: 10,
    mouthDiameterCm: 4.0,
    colors: 12,
    dishwasherSafe: true,
    handle: false,
  },
  articleUrls: [
    "/articles/thermos-tiger-bottle/",
    "/articles/thermos-kfm-020-vs-kfi-020/",
  ],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: "https://item.rakuten.co.jp/rakuten24/405671/",
      affiliate: false,
    },
  ],
  sources: [source("サーモス公式 商品ページ", THERMOS_OFFICIAL, "2026-08-12")],
  verifiedAt: "2026-08-12",
};

export const tigerMtaJ050: Product = {
  id: "tiger-mta-j050",
  categoryId: "water-bottle",
  brand: "タイガー",
  name: "タイガー 真空断熱ボトル MTA-J050",
  tags: ["water_bottle", "cold_strong", "handle", "big_mouth"],
  attributes: {
    capacityL: 0.5,
    weightKg: 0.26,
    coldEfficiencyC: 8,
    mouthDiameterCm: 4.8,
    colors: 4,
    dishwasherSafe: false,
    handle: true,
  },
  articleUrls: [
    "/articles/thermos-tiger-bottle/",
    "/articles/tiger-mta-j050-guide/",
  ],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: "https://item.rakuten.co.jp/irodorich/22410151/",
      affiliate: false,
    },
  ],
  sources: [source("タイガー公式 商品ページ", TIGER_OFFICIAL, "2026-08-12")],
  verifiedAt: "2026-08-12",
};

export const waterBottleProducts: readonly Product[] = [
  thermosJnlS500,
  tigerMtaJ050,
];
