import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const pigeonBottleSizeCandidateLabels = {
  left: "160ml",
  right: "240ml",
} as const;

export const pigeonBottleSizeStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "新生児期から使うボトルを用意する場合や、まず小容量の哺乳びんを選びたい場合は、対象月齢目安が0ヵ月からでSSサイズ乳首（丸穴）が付属する「160ml」が候補になります。哺乳量が増えてきた場合は、対象月齢目安が3ヵ月頃からでMサイズ乳首（Y字形）が付属する「240ml」が候補です。",
  caution:
    "どちらを選ぶ場合も、付属乳首のサイズと対象月齢目安は容量によって異なります。赤ちゃんの発達に合った乳首サイズの選び方はピジョン公式の案内を確認してください。",
  evidenceHref: "#comparison-details",
};

export const pigeonBottleSizePriorityOptions: readonly PriorityOption[] = [
  {
    id: "capacity",
    label: "容量",
    left: {
      score: 1,
      status: "official",
      reason: "公式商品ページで160mlと記載されています",
    },
    right: {
      score: 1,
      status: "official",
      reason: "公式商品ページで240mlと記載されています",
    },
    caution:
      "必要とする哺乳量は赤ちゃんによって異なり、公式ページには一律の基準はありません。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "nipple",
    label: "付属の乳首",
    left: {
      score: 1,
      status: "official",
      reason: "母乳実感 乳首 SSサイズ（0ヵ月から）・吸い穴 丸穴が付属します",
    },
    right: {
      score: 1,
      status: "official",
      reason: "母乳実感 乳首 Mサイズ（3ヵ月頃から）・吸い穴 Y字形が付属します",
    },
    caution:
      "容量によって付属乳首が異なるため、購入時は容量とあわせて乳首サイズを確認してください。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "target-age",
    label: "対象月齢の目安",
    left: {
      score: 1,
      status: "official",
      reason: "公式商品ページで0ヵ月からと記載されています",
    },
    right: {
      score: 1,
      status: "official",
      reason: "公式商品ページで3ヵ月頃からと記載されています",
    },
    caution: "対象月齢は目安です。赤ちゃんの様子に合わせて選んでください。",
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
