import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const babybjornCandidateLabels = {
  left: "ベビーキャリア HARMONY",
  right: "ベビーキャリア MINI",
} as const;

export const babybjornStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "ベビービョルン公式の比較表によると、HARMONY は新生児から約36ヶ月まで使える4WAY（対面ハイ・ロー、前向き、おんぶ）のモデルで、幅広なパッド入りショルダーベルトとエルゴノミックランバーサポート付きのウェストベルトを備えています。MINI は新生児から約12ヶ月までが対象で、ショルダーベルトと本体が別々のシンプル設計、ウェストベルトはありません。公式ショップ価格（2026-08-10確認）は HARMONY が27,280円〜、MINI が9,680円〜です。長く使える機能性を重視するなら HARMONY、新生児期の手軽さと価格を重視するなら MINI が候補になりますが、実際の着け心地の好みは公式情報だけでは判断できません。",
  caution:
    "対象月齢・対象体重は公式の比較表の値です。赤ちゃんの成長は個人差が大きいため、購入前に対象範囲と実際のお子さんの体格を公式ページで確認してください。",
  evidenceHref: "#comparison-details",
};

export const babybjornPriorityOptions: readonly PriorityOption[] = [
  {
    id: "period",
    label: "使える期間",
    left: {
      score: 2,
      status: "official",
      reason:
        "公式比較表で対象月齢0カ月〜約36ヶ月、対象体重3.2〜15kg、対象ヒップサイズ約〜160cmと案内。肩と腰のクッション付きで長期間の使用に対応",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "公式比較表で対象月齢0カ月〜約12ヶ月、対象体重3.2〜11kg、対象ヒップサイズ約〜120cmと案内。新生児〜乳児期中心のモデル",
    },
    caution:
      "「長く使いたい」なら HARMONY、「新生児期の抱っこがメイン」なら MINI という分け方ができます。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "style",
    label: "抱っこの種類（4WAYか2WAYか）",
    left: {
      score: 2,
      status: "official",
      reason:
        "公式で4通りの抱っこ（対面ハイポジション・対面ローポジション・前向き・おんぶ）が可能と案内。幅広なパッド入りショルダーベルトとエルゴノミックランバーサポート付きウェストベルトで肩と腰をサポート",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "公式で2通りの抱っこが可能と案内。ショルダーベルトと本体が別々のシンプル設計で、立ったままでも抱き入れられるのが特徴",
    },
    caution:
      "おんぶや前向きを含む多彩な抱き方をするなら HARMONY、対面中心で手軽に抱き入れたいなら MINI が候補です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "price-weight",
    label: "価格と軽さ",
    left: {
      score: 1,
      status: "official",
      reason: "公式ショップ価格27,280円〜（2026-08-10確認）。製品重量は約892g",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "公式ショップ価格9,680円〜（2026-08-10確認）。製品重量は約500gで、ウェストベルトなしのシンプル軽量設計",
    },
    caution:
      "価格は2026-08-10時点のベビービョルン公式楽天市場店の表示価格です。在庫・キャンペーンにより変動するため、購入時点の販売ページで確認してください。",
    evidenceHref: "#comparison-details",
  },
];
