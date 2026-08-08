import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const merriesCandidateLabels = {
  left: "ファーストプレミアム",
  right: "ずっと肌さらエアスルー",
} as const;

export const merriesStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "肌へのやさしさに関する公式機能を詳しく確認するなら「ファーストプレミアム」、ムレ・おしっこ対策の公式機能を確認するなら「ずっと肌さらエアスルー」から確認します。",
  caution:
    "実際の合いやすさは赤ちゃんの体型や肌状態でも変わるため、少量から試してください。",
  evidenceHref: "#comparison-details",
};

export const merriesPriorityOptions: readonly PriorityOption[] = [
  {
    id: "skin-care",
    label: "肌への配慮に関する公式機能",
    left: {
      score: 2,
      status: "official",
      reason:
        "カシミヤタッチの肌ざわり、吸収面の抗菌、アルガンオイル配合など肌に向けた機能が案内されています",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "通気を保つ構造とおしっこロックなど、ムレ・吸収を軸とした機能が案内されています",
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
      reason: "100%通気素材に加え、ゆるん等の背もたれ対策が案内されています",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "50億個以上の穴による通気とおしっこロック、瞬間吸収の溝が案内されています",
    },
    caution: "モレにくさは体型、装着方法、交換感覚でも変わります。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "newborn-size",
    label: "新生児サイズ",
    left: {
      score: 2,
      status: "official",
      reason: "新生児5kgまで（3,000g・5,000gの2展開）が掲載されています",
    },
    right: {
      score: 1,
      status: "official",
      reason: "新生児5kgまで（お誕生日〜5,000g）が掲載されています",
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
