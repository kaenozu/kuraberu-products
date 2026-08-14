import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const pigeonSlimCandidateLabels = {
  left: "母乳実感 240ml",
  right: "スリムタイプ 240ml",
} as const;

export const pigeonSlimStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "ピジョン公式では、母乳実感は「ママのおっぱいのような乳首」を特長に持つ広口タイプ、スリムタイプは「転がりにくく、持ちやすい形」の細身タイプとして案内されています。どちらも240mlで煮沸・スチーム・薬液消毒に対応しますが、付属する乳首のサイズ体系（吸い穴の形・対象月齢）は別体系です。ボトルの形と乳首の使い方で選ぶのが目安です。",
  caution:
    "母乳実感の乳首とスリムタイプの乳首は互換性の案内が異なります。ピジョン公式は母乳実感乳首について「スリムタイプ哺乳びんにはお使いいただけません」と明記しています。パーツの流用を考えている場合は必ず公式ページを確認してください。",
  evidenceHref: "#comparison-details",
};

export const pigeonSlimPriorityOptions: readonly PriorityOption[] = [
  {
    id: "shape-mouth",
    label: "ボトルの形状",
    left: {
      score: 2,
      status: "official",
      reason:
        "公式で「持ちやすい太さと使いやすい広口ボトル」（洗いやすく調乳もしやすい）と案内されています",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "公式で「転がりにくく、持ちやすい形」と案内されています（細身で手にフィットする形状）",
    },
    caution: "どちらの形状かは、実際に持った感覚で確認するのが確実です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "nipple-lineup",
    label: "乳首のサイズ体系",
    left: {
      score: 2,
      status: "official",
      reason: "6サイズ（SS・S・M・L・LL・3L）で、月齢に合わせた段階があります",
    },
    right: {
      score: 1,
      status: "official",
      reason: "4サイズ（S・M・Y・L）で、シンプルな段階です",
    },
    caution:
      "サイズ数が多い方が必ずしも良いわけではありません。選びやすさは用途によります。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "included-nipple",
    label: "付属する乳首（240ml）",
    left: {
      score: 1,
      status: "official",
      reason: "Mサイズ（Y字形・3ヵ月頃から）が付属します",
    },
    right: {
      score: 1,
      status: "official",
      reason: "Mサイズ（丸穴・4ヵ月頃〜）が付属します",
    },
    caution:
      "どちらも「M」ですが、吸い穴の形と対象月齢が違います。母乳実感はY字形・3ヵ月頃から、スリムタイプは丸穴・4ヵ月頃〜です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "sterilization",
    label: "消毒・除菌方法",
    left: {
      score: 1,
      status: "official",
      reason: "煮沸・スチム・薬液に対応（電子レンジ除菌は不可）",
    },
    right: {
      score: 1,
      status: "official",
      reason: "煮沸・スチーム・薬液に対応（電子レンジ除菌は不可）",
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
