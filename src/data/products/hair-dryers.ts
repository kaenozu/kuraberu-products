/**
 * ドライヤー（パナソニック ナノケア）カテゴリの商品データ。
 *
 * 数値・属性の根拠は、パナソニック公式の商品ページ・仕様ページのみ。
 * 確認日とソースを保持し、未確認のスペックや推測値は入れない。
 *
 * 対象: パナソニック ナノケア EH-NA9M / EH-NA7M
 */

import type { Product } from "../../domain/diagnosis/types";
import { rakutenAffiliateSearchUrl } from "../../lib/rakuten-affiliate";

const NA9M_OFFICIAL = "https://panasonic.jp/hair/products/EH-NA9M.html";
const NA9M_SPEC = "https://panasonic.jp/hair/products/EH-NA9M/spec.html";
const NA7M_OFFICIAL = "https://panasonic.jp/hair/products/EH-NA7M.html";
const NA7M_SPEC = "https://panasonic.jp/hair/products/EH-NA7M/spec.html";

function source(
  label: string,
  url: string,
  checkedAt: string,
): Product["sources"][number] {
  return { label, url, checkedAt };
}

export const panasonicEhNa9m: Product = {
  id: "panasonic-eh-na9m",
  categoryId: "hair-dryer",
  brand: "パナソニック ナノケア",
  name: "パナソニック ナノケア EH-NA9M",
  tags: ["hair_dryer", "care_modes", "mineral", "uv_care"],
  attributes: {
    weightG: 580,
    foldable: false,
    careModes: 4,
    mineral: true,
    uvCare: true,
    airflowM3PerMin: 1.5,
  },
  articleUrls: [
    "/articles/panasonic-eh-na9m-vs-eh-na7m/",
    "/articles/panasonic-eh-na9m-guide/",
    "/articles/panasonic-eh-na9m-vs-refa-beautech/",
  ],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: rakutenAffiliateSearchUrl("EH-NA9M"),
      affiliate: true,
    },
  ],
  sources: [
    source("パナソニック公式 商品ページ", NA9M_OFFICIAL, "2026-08-16"),
    source("パナソニック公式 仕様ページ", NA9M_SPEC, "2026-08-16"),
  ],
  verifiedAt: "2026-08-16",
};

export const panasonicEhNa7m: Product = {
  id: "panasonic-eh-na7m",
  categoryId: "hair-dryer",
  brand: "パナソニック ナノケア",
  name: "パナソニック ナノケア EH-NA7M",
  tags: ["hair_dryer", "foldable", "light"],
  attributes: {
    weightG: 565,
    foldable: true,
    careModes: 0,
    mineral: false,
    uvCare: false,
    airflowM3PerMin: 1.5,
  },
  articleUrls: ["/articles/panasonic-eh-na9m-vs-eh-na7m/"],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: rakutenAffiliateSearchUrl("EH-NA7M"),
      affiliate: true,
    },
  ],
  sources: [
    source("パナソニック公式 商品ページ", NA7M_OFFICIAL, "2026-08-16"),
    source("パナソニック公式 仕様ページ", NA7M_SPEC, "2026-08-16"),
  ],
  verifiedAt: "2026-08-16",
};

export const hairDryerProducts: readonly Product[] = [
  panasonicEhNa9m,
  panasonicEhNa7m,
];
