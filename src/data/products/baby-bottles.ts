/**
 * 哺乳瓶カテゴリの商品データ。
 *
 * 診断エンジンが使う構造化データ。数値・属性の根拠はピジョン公式商品ページ
 * （products.pigeon.co.jp）のみで、確認日（verifiedAt）とソースを保持する。
 * 未確認のスペックや推測値は入れない。
 *
 * 対象: 母乳実感 哺乳びん 160ml/240ml × 耐熱ガラス製/プラスチック製（PPSU）
 */

import type { Product } from "../../domain/diagnosis/types";

const PIGEON_160_GLASS = "https://products.pigeon.co.jp/item/index-2376.html";
const PIGEON_160_PPSU = "https://products.pigeon.co.jp/item/index-2377.html";
const PIGEON_240_PPSU = "https://products.pigeon.co.jp/item/index-2378.html";
const PIGEON_240_GLASS = "https://products.pigeon.co.jp/item/index-2382.html";

/** ピジョン公式商品ページ（2026-08-11 確認） */
function pigeonSource(url: string): {
  label: string;
  url: string;
  checkedAt: string;
} {
  return {
    label: "ピジョン 母乳実感 商品ページ",
    url,
    checkedAt: "2026-08-11",
  };
}

export const babyBottle160Glass: Product = {
  id: "bo160-glass",
  categoryId: "baby-bottle",
  brand: "ピジョン",
  name: "母乳実感 哺乳びん 耐熱ガラス製 160ml",
  tags: ["newborn", "glass", "small_capacity", "easy_to_clean"],
  attributes: {
    capacity: 160,
    material: "glass",
    lightweight: false,
    portable: false,
    longTermUse: false,
  },
  articleUrls: ["/articles/pigeon-bottle-160-240/"],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: "https://a.r10.to/h4SQzW",
      affiliate: true,
    },
  ],
  sources: [pigeonSource(PIGEON_160_GLASS)],
  verifiedAt: "2026-08-11",
};

export const babyBottle160Ppsu: Product = {
  id: "bo160-ppsu",
  categoryId: "baby-bottle",
  brand: "ピジョン",
  name: "母乳実感 哺乳びん プラスチック製（PPSU）160ml",
  tags: ["newborn", "ppsu", "lightweight", "small_capacity", "portable"],
  attributes: {
    capacity: 160,
    material: "ppsu",
    lightweight: true,
    portable: true,
    longTermUse: false,
  },
  articleUrls: ["/articles/pigeon-bottle-160-240/"],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: "https://a.r10.to/h4SQzW",
      affiliate: true,
    },
  ],
  sources: [pigeonSource(PIGEON_160_PPSU)],
  verifiedAt: "2026-08-11",
};

export const babyBottle240Glass: Product = {
  id: "bo240-glass",
  categoryId: "baby-bottle",
  brand: "ピジョン",
  name: "母乳実感 哺乳びん 耐熱ガラス製 240ml",
  tags: ["glass", "large_capacity", "easy_to_clean"],
  attributes: {
    capacity: 240,
    material: "glass",
    lightweight: false,
    portable: false,
    longTermUse: true,
  },
  articleUrls: ["/articles/pigeon-bottle-240/"],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: "https://a.r10.to/hR4mwU",
      affiliate: true,
    },
  ],
  sources: [pigeonSource(PIGEON_240_GLASS)],
  verifiedAt: "2026-08-11",
};

export const babyBottle240Ppsu: Product = {
  id: "bo240-ppsu",
  categoryId: "baby-bottle",
  brand: "ピジョン",
  name: "母乳実感 哺乳びん プラスチック製（PPSU）240ml",
  tags: ["ppsu", "lightweight", "large_capacity", "portable", "longTermUse"],
  attributes: {
    capacity: 240,
    material: "ppsu",
    lightweight: true,
    portable: true,
    longTermUse: true,
  },
  articleUrls: ["/articles/pigeon-bottle-240/"],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: "https://a.r10.to/hk5urF",
      affiliate: true,
    },
  ],
  sources: [pigeonSource(PIGEON_240_PPSU)],
  verifiedAt: "2026-08-11",
};

export const babyBottleProducts: readonly Product[] = [
  babyBottle160Glass,
  babyBottle160Ppsu,
  babyBottle240Glass,
  babyBottle240Ppsu,
];
