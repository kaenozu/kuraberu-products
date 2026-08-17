/**
 * おむつ（紙おむつ・テープタイプM）カテゴリの商品データ。
 *
 * 数値・属性の根拠はユニ・チャーム公式（jp.moony.com）のみ。確認日と
 * ソースを保持し、未確認のスペックや推測値は入れない。
 *
 * 対象: ムーニー テープタイプ Mサイズ 2商品
 */

import type { Product } from "../../domain/diagnosis/types";

const MOONY_TEISHIGEKI_M = "https://jp.moony.com/ja/products/nmn/nmn-m.html";
const MOONY_MASHUMARO_M = "https://jp.moony.com/ja/products/mn/mn-m.html";

function moonySource(url: string): {
  label: string;
  url: string;
  checkedAt: string;
} {
  return {
    label: "ムーニー公式 商品ページ",
    url,
    checkedAt: "2026-08-09",
  };
}

export const moonyTeishigekiM: Product = {
  id: "moony-teishigeki-m",
  categoryId: "diaper",
  brand: "ムーニー",
  name: "ムーニー 低刺激であんしん（テープ・M）",
  tags: ["tape", "m_size", "unadditive_3", "poop_absorption"],
  attributes: {
    size: "M",
    weightTargetKgMin: 6,
    weightTargetKgMax: 11,
    count: 46,
    unadditive: 3,
    maxHourAbsorption: 0,
    poopStopper: false,
    poopAbsorption: true,
  },
  articleUrls: ["/articles/moony-m/"],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: "https://a.r10.to/h58jf3",
      affiliate: true,
    },
  ],
  sources: [moonySource(MOONY_TEISHIGEKI_M)],
  verifiedAt: "2026-08-09",
};

export const moonyMashumaroM: Product = {
  id: "moony-mashumaro-m",
  categoryId: "diaper",
  brand: "ムーニー",
  name: "ムーニー マシュマロ肌ごこちモレ安心（テープ・M）",
  tags: ["tape", "m_size", "unadditive_4", "poop_stopper", "long_hours"],
  attributes: {
    size: "M",
    weightTargetKgMin: 6,
    weightTargetKgMax: 11,
    count: 54,
    unadditive: 4,
    maxHourAbsorption: 12,
    poopStopper: true,
    poopAbsorption: false,
  },
  articleUrls: ["/articles/moony-m/"],
  purchaseLinks: [
    {
      provider: "rakuten",
      url: "https://a.r10.to/h5ZjVa",
      affiliate: true,
    },
  ],
  sources: [moonySource(MOONY_MASHUMARO_M)],
  verifiedAt: "2026-08-09",
};

export const diaperProducts: readonly Product[] = [
  moonyTeishigekiM,
  moonyMashumaroM,
];
