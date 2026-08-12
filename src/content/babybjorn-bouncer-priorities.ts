import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const babybjornBouncerCandidateLabels = {
  left: "バウンサー Bliss",
  right: "バウンサー バランスソフト",
} as const;

export const babybjornBouncerStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "ベビービョルン公式の案内によると、Bliss とバランスソフトはどちらも「セルフバウンシング構造」を備えたバウンサーで、対象は生後約1ヶ月〜2才（バウンサーとしての使用は体重9kgまで）です。主な違いはシートの素材とデザインにあります。Bliss はベビービョルンのバウンサー最新モデルで、シートカバーをより柔らかく仕上げたモデルとされ、20種類以上のバリエーションがあります。バランスソフトは2トーンの生地が特長で、直近カラーバリエーションが増えています。2026-08-10時点の公式楽天市場店ではどちらもカラー限定SALEで同価格帯（17,600円〜19,800円）で販売されていました。実際の肌触りやデザインの好みは、公式情報だけでは判断できません。",
  caution:
    "対象月齢・対象体重は公式の商品ページの案内です。赤ちゃんの成長は個人差が大きいため、購入前に対象範囲を公式ページで確認してください。",
  evidenceHref: "#comparison-details",
};

export const babybjornBouncerPriorityOptions: readonly PriorityOption[] = [
  {
    id: "design",
    label: "シートの素材とデザイン",
    left: {
      score: 2,
      status: "official",
      reason:
        "公式で「ベビービョルンのバウンサー最新モデル。シートカバーをより柔らかく仕上げたモデル」と案内。3Dジャージー（放熱効果）・コットン・Air（メッシュ）・ウーブンなど20種類以上のバリエーション",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "公式で「2トーンの生地が特長」と案内。コットン・Air（メッシュ）・ウーブン/ジャージーの素材展開",
    },
    caution:
      "デザインと素材の幅広さを重視するなら Bliss、2トーンの落ち着いた見た目を好むならバランスソフトが候補です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "feature",
    label: "使える期間と機能",
    left: {
      score: 2,
      status: "official",
      reason:
        "公式で対象は「生後約1ヶ月〜2才くらい（最大体重13kg）」。セルフバウンシング構造・3段階リクライニング（従来比でより細かな角度調整）を案内",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "公式で対象は「生後約1ヶ月〜2才くらい（最大体重13kg）」。セルフバウンシング構造・3段階リクライニングを案内。バウンサーとしての使用は体重9kgまで",
    },
    caution:
      "機能面では両モデルとも公式案内に大きな違いはありません。どちらも同じ期間・体重の範囲で使えます。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "price",
    label: "公式ショップ価格（2026-08-10確認）",
    left: {
      score: 2,
      status: "official",
      reason:
        "公式楽天市場店のカラー限定SALEで17,600円〜19,800円（カラー・素材により変動・2026-08-10確認）",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "公式楽天市場店のカラー限定SALEで17,600円〜19,800円（カラー・素材により変動・2026-08-10確認）",
    },
    caution:
      "価格は2026-08-10時点のベビービョルン公式楽天市場店の表示価格です。在庫・キャンペーンにより変動するため、購入時点の販売ページで確認してください。",
    evidenceHref: "#comparison-details",
  },
];
