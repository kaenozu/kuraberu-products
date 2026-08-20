/**
 * 楽天商品クエリレジストリ。
 *
 * AffiliateButton と resolvePurchaseHref の両方が使う。各エントリは
 * Rakuten API の検索キーワード + selectRakutenProduct の選択条件を
 * 持つ。productId で参照する。
 *
 * 新商品を追加する場合: このファイルにエントリを追加するだけで、
 * AffiliateButton・CommercialArticlePage 両方で利用できる。
 */

import type { RakutenSelectionOptions } from "./rakuten";

export type ProductId =
  | "pampers-premium-newborn"
  | "pampers-sarasara-newborn"
  | "merries-fp-newborn"
  | "merries-airsle-newborn"
  | "pigeon-glass-240"
  | "pigeon-ppsu-240"
  | "pigeon-slim-240"
  | "pigeon-160"
  | "moony-teishigeki-m"
  | "moony-mashumaro-m"
  | "shupot-dendo"
  | "shupot-shudo";

export type ProductQuery = {
  keyword: string;
  requiredTerms: readonly string[];
  selection: RakutenSelectionOptions;
};

/**
 * 各商品の楽天API検索条件。
 * keyword はAPI検索クエリ、requiredTerms は商品名に必ず含まれるべき語、
 * selection は excludedTerms / exactItemCodes / exactIdentifiers で
 * 曖昧な候補を除外する。
 */
export const productQueries: Record<ProductId, ProductQuery> = {
  "pampers-premium-newborn": {
    keyword: "パンパース 肌へのいちばん 新生児",
    requiredTerms: ["パンパース", "肌へのいちばん", "新生児"],
    selection: {
      excludedTerms: ["90枚", "2パック", "セット", "旧モデル"],
      exactIdentifiers: ["4987176203229"],
    },
  },
  "pampers-sarasara-newborn": {
    keyword: "パンパース さらさらケア 新生児",
    requiredTerms: ["パンパース", "さらさらケア", "新生児"],
    selection: {
      excludedTerms: ["パンツ", "2パック", "セット", "旧モデル"],
      exactIdentifiers: ["1710000040"],
    },
  },
  "merries-fp-newborn": {
    keyword: "メリーズ ファーストプレミアム 新生児 テープ",
    requiredTerms: ["メリーズ", "ファーストプレミアム", "新生児"],
    selection: {
      excludedTerms: ["パンツ", "ケース", "ふるさと", "4パック", "6個", "×"],
      exactItemCodes: ["rakutensokuhaimart:10018752"],
    },
  },
  "merries-airsle-newborn": {
    keyword: "花王 メリーズ エアスルー テープ 新生児用",
    requiredTerms: ["メリーズ", "エアスルー", "新生児"],
    selection: {
      excludedTerms: [
        "パンツ",
        "ケース",
        "2パック",
        "4個",
        "Sサイズ",
        "Mサイズ",
      ],
      exactItemCodes: ["matsukiyo:10547359"],
    },
  },
  "pigeon-glass-240": {
    keyword: "ピジョン 母乳実感 哺乳びん 240ml 耐熱ガラス",
    requiredTerms: ["ピジョン", "母乳実感", "240ml"],
    selection: {
      excludedTerms: ["プラスチック", "PPSU", "スリム", "セット", "2本"],
      exactIdentifiers: ["4902508024488"],
    },
  },
  "pigeon-ppsu-240": {
    keyword: "ピジョン 母乳実感 哺乳びん 240ml プラスチック",
    requiredTerms: ["ピジョン", "母乳実感", "240ml"],
    selection: {
      excludedTerms: ["ガラス", "スリム", "セット", "2本"],
      exactIdentifiers: ["4902508024518"],
    },
  },
  "pigeon-slim-240": {
    keyword: "ピジョン スリムタイプ 哺乳びん 240ml プラスチック",
    requiredTerms: ["ピジョン", "スリムタイプ", "240ml"],
    selection: {
      excludedTerms: ["ガラス", "母乳実感", "セット", "2本", "200ml"],
      exactIdentifiers: ["4902508003650"],
    },
  },
  "pigeon-160": {
    keyword: "ピジョン 母乳実感 哺乳びん 160ml プラスチック",
    requiredTerms: ["ピジョン", "母乳実感", "160ml"],
    selection: {
      excludedTerms: ["プラスチック", "240ml", "スリム", "セット", "2本"],
      exactItemCodes: ["pigeon-shop:1026735"],
    },
  },
  "moony-teishigeki-m": {
    keyword: "ムーニー 低刺激であんしん M テープ 46枚",
    requiredTerms: ["低刺激であんしん", "Mサイズ", "テープ"],
    selection: {
      excludedTerms: [
        "パンツ",
        "ケース",
        "×4",
        "4袋",
        "まとめ買い",
        "Sサイズ",
        "Lサイズ",
      ],
      exactItemCodes: ["unicharm:100619"],
    },
  },
  "moony-mashumaro-m": {
    keyword: "ムーニー マシュマロ肌ごこちモレ安心 Mサイズ 54枚 テープ",
    requiredTerms: ["マシュマロ肌ごこち", "Mサイズ"],
    selection: {
      excludedTerms: [
        "パンツ",
        "ケース",
        "×4",
        "4袋",
        "まとめ買い",
        "Sサイズ",
        "Lサイズ",
      ],
      exactItemCodes: ["unicharm:101302"],
    },
  },
  "shupot-dendo": {
    keyword: "ピジョン 電動鼻吸い器 シュポット",
    requiredTerms: ["シュポット", "電動"],
    selection: {
      excludedTerms: [
        "セット",
        "まとめ買い",
        "フィット鼻ノズル",
        "鼻水キャッチャー",
        "パーフェクト",
      ],
      exactItemCodes: ["pigeon-shop:1032018"],
    },
  },
  "shupot-shudo": {
    keyword: "ピジョン 手動鼻吸い器 シュポットポンプ フィット鼻ノズル",
    requiredTerms: ["シュポットポンプ", "手動"],
    selection: {
      excludedTerms: ["電動", "セット", "まとめ買い"],
      exactItemCodes: ["pigeon-shop:2000638s"],
    },
  },
} as const;
