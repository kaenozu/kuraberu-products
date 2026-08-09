import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const merriesPantsCandidateLabels = {
  left: "ファーストプレミアム",
  right: "ずっと肌さらエアスルー",
} as const;

export const merriesPantsStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "肌へのやさしさに関する公式機能を詳しく確認するなら「ファーストプレミアム」、おむつ内のムレ・おしっこ対策の公式機能を確認するなら「ずっと肌さらエアスルー」から確認します。サイズ展開は両方ともS・M・L・ビッグの4展開です。",
  caution:
    "実際の合いやすさは赤ちゃんの体型や動き方でも変わるため、少量から試してください。",
  evidenceHref: "#comparison-details",
};

export const merriesPantsPriorityOptions: readonly PriorityOption[] = [
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
        "シート表面の穴による通気と、ゆるうんちを広げずキャッチする凹凸シートなどが案内されています",
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
      reason:
        "背中モレ安心のフィットギャザーと、密着姿勢で背中に流れるうんち対策が案内されています",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "縦横の溝でおしっこを瞬間吸収、吸収して戻さないおしっこロック、ゆるうんち吸収シートが案内されています",
    },
    caution: "モレにくさは体型、装着方法、交換感覚でも変わります。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "size-lineup",
    label: "パンツタイプのサイズ展開",
    left: {
      score: 2,
      status: "official",
      reason: "S・M・L・ビッグの4サイズ展開が掲載されています",
    },
    right: {
      score: 2,
      status: "official",
      reason: "S・M・L・ビッグの4サイズ展開が掲載されています",
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
