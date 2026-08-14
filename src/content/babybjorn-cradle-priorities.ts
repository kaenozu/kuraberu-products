import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const cradleCandidateLabels = {
  left: "ベビービョルン クレードル",
  right: "アップリカ ココネルエアー AB",
} as const;

export const cradleStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "ベビービョルン公式の案内によると、クレードルは新生児〜生後6か月（体重8kgまで）を対象とした手動のゆりかご型ベビーベッドです。メッシュ素材で透けて見えるデザイン、軽量で移動しやすい構造（本体サイズ 幅約79×奥行約58×高さ約65cm・約8kg）、手や足で優しく揺らせる「制御された、やさしい、はずみのある動き」が特長です。一方、アップリカ公式楽天市場店の案内によると、ココネルエアー AB は新生児（体重2.5kg）〜24カ月（体重13kg）まで使える折りたたみ式ベビーベッドで、上段（新生児〜つかまり立ち頃）・下段（つかまり立ち頃〜24カ月）の2段階、開いた状態で幅1052×奥行704×高さ951mm・約14.5kg、キャスター付き・収納袋付きで、大きくなったらベビーサークルとしても使えます。使用期間の長さと揺れの有無が最大の違いです。実際の使い心地は、公式情報だけでは判断できません。",
  caution:
    "対象月齢・対象体重は各メーカー公式の商品ページの案内です。赤ちゃんの成長は個人差が大きいため、購入前に対象範囲を公式ページで確認してください。",
  evidenceHref: "#comparison-details",
};

export const cradlePriorityOptions: readonly PriorityOption[] = [
  {
    id: "usage-period",
    label: "使用できる期間",
    left: {
      score: 1,
      status: "official",
      reason:
        "ベビービョルン公式の案内で「新生児から生後6か月（8kg）までご利用いただけます」と記載。使用期間は短めのゆりかご型。",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "アップリカ公式の案内で「新生児（体重2.5kg）〜24カ月（体重13kg）まで」と記載。上段・下段の2段階で長く使える。",
    },
    caution:
      "長く使うことを重視するならココネルエアー、新生児期だけの専用ベッドを求めるならクレードルが候補です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "rocking",
    label: "揺れ（ゆりかご機能）",
    left: {
      score: 2,
      status: "official",
      reason:
        "ベビービョルン公式の案内で「両親が手や足で簡単に優しく揺らせてあげることができます」と記載。制御された、やさしい、はずみのある動き。",
    },
    right: {
      score: 0,
      status: "official",
      reason:
        "ココネルエアー AB の公式案内に揺れ機能の記載なし（固定式のベビーベッド）。",
    },
    caution:
      "揺れで寝かしつけたい場合はクレードルが候補です。固定式で安全第一ならココネルエアーです。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "size-weight",
    label: "サイズ・重量・持ち運び",
    left: {
      score: 2,
      status: "official",
      reason:
        "本体 幅約79×奥行約58×高さ約65cm・約8kg。ベビービョルン公式は「軽量で女性でも簡単に移動させることができます」と案内。",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "開いた状態で幅約1052×奥行約704×高さ約951mm・約14.5kg（収納袋を除く）。キャスター付きで移動はできるが、クレードルより大きく重い。",
    },
    caution:
      "部屋間の移動の頻度が高い場合はクレードル、据え置きでサークル兼用ならココネルエアーが候補です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "folding",
    label: "折りたたみ・収納",
    left: {
      score: 0,
      status: "official",
      reason:
        "クレードルの公式案内に折りたたみ・収納袋の記載なし（据え置き型のゆりかご）。",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "アップリカ公式の案内で「カンタンに折りたたんで持ち運ぶことができる」「収納袋」と記載。閉じた状態 幅約260×奥行約260×高さ約951mm。帰省・旅行にも使える。",
    },
    caution: "帰省先や旅行先でも使いたい場合はココネルエアーが候補です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "multi-use",
    label: "サークル兼用などの多用途",
    left: {
      score: 0,
      status: "official",
      reason: "クレードルは新生児期のベッド用途のみ。キャノピーは別売り。",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "アップリカ公式の案内で「大きくなったらベビーサークルとしても使えます」と記載。おむつ替えやお掃除のときの一時置きにも使える。",
    },
    caution:
      "ベッドの後もサークルとして使いたい場合はココネルエアーが候補です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "price",
    label: "公式ショップの価格（2026-08-10確認）",
    left: {
      score: 1,
      status: "official",
      reason: "ベビービョルン公式楽天市場店で 49,500円（送料無料）。高単価。",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "アップリカ公式楽天市場店で 29,700円。他店では 26,000円台〜の出品あり。",
    },
    caution:
      "価格は購入時点の販売ページで確認してください。公式ショップはキャンペーンで変動することがあります。",
    evidenceHref: "#comparison-details",
  },
];
