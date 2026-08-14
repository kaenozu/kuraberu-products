import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const babybjornOnekaiCandidateLabels = {
  left: "ベビーキャリア ONE KAI",
  right: "ベビーキャリア MOVE",
} as const;

export const babybjornOnekaiStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "ベビービョルン公式の比較表によると、ONE KAI は新生児から約36ヶ月まで使える4WAY（対面ハイ・ロー、前向き、おんぶ）のモデルで、赤ちゃんの身体に沿った3D構造と幅広ウエストベルトを備えています。MOVE は新生児から約15ヶ月までが対象の2WAYモデルで、フルメッシュ素材で通気性を重視しています。公式ショップ価格（2026-08-10確認）は ONE KAI が27,500円、MOVE が22,000円です。長く使えて多彩な抱き方をしたいなら ONE KAI、通気性の良さと軽やかさを重視するなら MOVE が候補になりますが、実際の着け心地の好みは公式情報だけでは判断できません。",
  caution:
    "対象月齢・対象体重は公式の比較表の値です。赤ちゃんの成長は個人差が大きいため、購入前に対象範囲と実際のお子さんの体格を公式ページで確認してください。",
  evidenceHref: "#comparison-details",
};

export const babybjornOnekaiPriorityOptions: readonly PriorityOption[] = [
  {
    id: "period",
    label: "使える期間",
    left: {
      score: 2,
      status: "official",
      reason:
        "公式比較表で対象月齢0カ月〜約36ヶ月、対象体重3.5〜15kg、対象ヒップサイズ約〜160cmと案内",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "公式比較表で対象月齢0カ月〜約15ヶ月、対象体重3.2〜12kg、対象ヒップサイズ約〜120cmと案内",
    },
    caution:
      "「長く使いたい」なら ONE KAI、「新生児〜1歳過ぎまで」なら MOVE という分け方ができます。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "style",
    label: "抱っこの種類（4WAYか2WAYか）",
    left: {
      score: 2,
      status: "official",
      reason:
        "公式で4通りの抱っこ（対面ハイポジション・対面ローポジション・前向き・おんぶ）が可能と案内。赤ちゃんの身体に沿った3D構造でぴったり抱っこ",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "公式で2通りの抱っこが可能と案内。フルメッシュ素材で通気性抜群のシンプルなモデル",
    },
    caution:
      "おんぶや前向きを含む多彩な抱き方をするなら ONE KAI、対面中心なら MOVE が候補です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "price-weight",
    label: "価格と軽さ",
    left: {
      score: 1,
      status: "official",
      reason: "公式ショップ価格27,500円（2026-08-10確認）。製品重量は約1000g",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "公式ショップ価格22,000円（2026-08-10確認）。製品重量は約860gで、ショルダーパッド・ウエストベルトの項目が「ー」のスッキリ設計",
    },
    caution:
      "価格は2026-08-10時点のベビービョルン公式楽天市場店の表示価格です。在庫・キャンペーンにより変動するため、購入時点の販売ページで確認してください。",
    evidenceHref: "#comparison-details",
  },
];
