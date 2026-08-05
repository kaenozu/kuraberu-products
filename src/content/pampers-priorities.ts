import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const pampersCandidateLabels = {
  left: "肌へのいちばん",
  right: "さらさらケア",
} as const;

export const pampersStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "肌へのやさしさに関する公式機能を詳しく確認するなら「肌へのいちばん」、モレ・ムレ対策の公式機能を確認するなら「さらさらケア」から確認します。",
  caution:
    "実際の合いやすさは赤ちゃんの体型や肌状態でも変わるため、少量から試してください。",
  evidenceHref: "#comparison-details",
};

export const pampersPriorityOptions: readonly PriorityOption[] = [
  {
    id: "skin-care",
    label: "肌への配慮に関する公式機能",
    left: {
      score: 2,
      status: "official",
      reason:
        "ワセリン配合シート、ふかふか肌ざわり、ゆるうんちの肌残りを抑える設計が案内されています",
    },
    right: {
      score: 1,
      status: "official",
      reason: "吸収体とムレ対策の機能が案内されています",
    },
    caution: "機能表示は肌トラブルが起きないことを保証するものではありません。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "leak-fit",
    label: "モレ・フィット対策の公式機能",
    left: {
      score: 1,
      status: "official",
      reason: "ゆるうんちを素早く吸収する機能が案内されています",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "360°ゆるうんちモレガードとのびのびフィットテープが案内されています",
    },
    caution: "モレにくさは体型、装着方法、交換間隔でも変わります。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "newborn-size",
    label: "新生児サイズ",
    left: {
      score: 1,
      status: "official",
      reason: "新生児5kgまでが掲載され、小さめ新生児3,000gも案内されています",
    },
    right: {
      score: 1,
      status: "official",
      reason: "新生児5kgまでが掲載されています",
    },
    caution: "同じ体重でも体型によって合いやすさは異なります。",
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
