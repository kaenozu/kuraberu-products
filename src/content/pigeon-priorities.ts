import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const pigeonBottleCandidateLabels = {
  left: "耐熱ガラス製",
  right: "プラスチック製（PPSU）",
} as const;

export const pigeonBottleStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "自宅中心で「汚れが落ちやすい」ことを重視するなら「耐熱ガラス製」、持ち運びや「軽さ・割れにくさ」を重視するなら「プラスチック製（PPSU）」が候補になります。240ml同士なら付属乳首・消毒方法などの基本仕様は共通です。",
  caution:
    "どちらの素材も、落としたりぶつけたりする使用状況によっては破損・キズが生じることがあります。使用時は乳幼児から目を離さず、公式の使い方に従ってください。",
  evidenceHref: "#comparison-details",
};

export const pigeonBottlePriorityOptions: readonly PriorityOption[] = [
  {
    id: "material-clean",
    label: "汚れの落ちやすさ",
    left: {
      score: 2,
      status: "official",
      reason: "ピジョン公式Q&Aで「汚れが落ちやすいので清潔」と案内されています",
    },
    right: {
      score: 0,
      status: "official",
      reason:
        "公式Q&Aで「ガラスに比べてキズがつきやすく、色やにおいなどが吸着しやすい」と案内されています",
    },
    caution: "吸着しやすさは、使用・洗浄の積み重ねによる経年変化の目安です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "light-safe",
    label: "軽さ・割れにくさ",
    left: {
      score: 0,
      status: "official",
      reason: "公式Q&Aで「重い／欠け・割れることがある」と案内されています",
    },
    right: {
      score: 2,
      status: "official",
      reason: "公式Q&Aで「軽い、落としても割れにくい」と案内されています",
    },
    caution:
      "ガラス製は使用状況によって割れることがあり、割れた場合やけど・けがにつながる恐れがあります。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "base-spec",
    label: "基本仕様（容量・乳首・消毒）",
    left: {
      score: 1,
      status: "official",
      reason:
        "240ml・Mサイズ乳首付属・煮沸／スチーム／薬液消毒に対応（電子レンジ除菌は不可）",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "240ml・Mサイズ乳首付属・煮沸／スチーム／薬液消毒に対応（電子レンジ除菌は不可）",
    },
    caution:
      "どちらも電子レンジ除菌は不可です。消毒・除菌方法を選ぶ際は公式案内を確認してください。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "price",
    label: "価格",
    left: { status: "unverified", reason: "価格は販売ページで確認が必要です" },
    right: { status: "unverified", reason: "価格は販売ページで確認が必要です" },
    caution:
      "価格・送料・ポイント・在庫は変動するため、記事の固定評価には使用しません。",
    evidenceHref: "#comparison-details",
  },
];
