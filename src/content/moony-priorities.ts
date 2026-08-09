import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const moonyCandidateLabels = {
  left: "低刺激であんしん（テープ）",
  right: "マシュマロ肌ごこちモレ安心（テープ）",
} as const;

export const moonyStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "ユニ・チャーム公式では、低刺激であんしんは「うんち水分吸収シートで、うんちがお肌につきにくい」ことを特長とするテープタイプ、マシュマロ肌ごこちモレ安心は「無添加弱酸性素材」と「ゆるうんちストッパー」を特長とするテープタイプとして案内されています。どちらも最大12時間※吸収に対応しますが（※吸収量の目安。使用時間の目安ではありません）、サイズによって公式の素材・機能表示が異なるため、シリーズ名だけで判断せず、購入するサイズの商品ページで確認するのが目安です。",
  caution:
    "低刺激であんしんはサイズ間で仕様が異なります。新生児・S・Mでは「オーガニックコットンは含まれておりません」・3成分無添加（香料・ラテックス・合成着色料）ですが、Lではオーガニックコットン一部配合・植物オイル3種類配合・4成分無添加（石油由来油剤を加えた成分）と公式に案内されています。購入前にサイズ別の公式ページを確認してください。",
  evidenceHref: "#comparison-details",
};

export const moonyPriorityOptions: readonly PriorityOption[] = [
  {
    id: "poop-sheet",
    label: "うんち対策の機能",
    left: {
      score: 2,
      status: "official",
      reason:
        "新生児〜Mで「うんち水分吸収シート」（2層構造で水分を下層へ吸収し、肌への広がり・付着を低減）と「おしりガイド」を公式に案内",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "Mで「背中と足回りにゆるうんちストッパー」を公式に案内しています（低刺激であんしんの水分吸収シートのような機能はサイズページに明記されていません）",
    },
    caution:
      "「絶対に漏れない」とは書けないため、公式が案内する機能の有無の比較にとどめます。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "additive-free",
    label: "無添加の成分（公式表記）",
    left: {
      score: 1,
      status: "official",
      reason:
        "新生児〜Mは「香料・ラテックス・合成着色料」の3成分無添加。Lは4成分無添加（+石油由来油剤）",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "新生児〜Lで「石油由来油剤・香料・ラテックス・合成着色料」の4成分無添加を案内。また無添加弱酸性素材を搭載",
    },
    caution:
      "成分数が多いほど良いという断定はできません。無添加は「何が無いか」で確認してください。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "organic-cotton",
    label: "オーガニックコットン",
    left: {
      score: 2,
      status: "official",
      reason:
        "Lサイズで「オーガニックコットン一部配合シート」を公式に案内しています",
    },
    right: {
      score: 0,
      status: "official",
      reason:
        "公式の商品ページではオーガニックコットンに関する表記が見つかりません",
    },
    caution:
      "低刺激であんしんの新生児〜Mにはオーガニックコットンは含まれていません。Lだけの仕様です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "plant-oil",
    label: "天然植物オイル",
    left: {
      score: 2,
      status: "official",
      reason:
        "Lサイズで「表面シートに保湿・抗炎症効果のある3種類の天然植物オイル（オリーブ・ホホバ・ライス）」を公式に案内",
    },
    right: {
      score: 0,
      status: "official",
      reason: "公式の商品ページでは植物オイルに関する表記が見つかりません",
    },
    caution:
      "植物オイルの保湿効果は「配合」の記載にとどまり、肌への効果を保証するものではありません。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "ventilation",
    label: "通気の機能",
    left: {
      score: 1,
      status: "official",
      reason: "Mサイズで「さらさら全面通気シート」を公式に案内しています",
    },
    right: {
      score: 1,
      status: "official",
      reason: "Lサイズで「さらさら全面通気シート」を公式に案内しています",
    },
    caution:
      "通気機能の有無はサイズとラインで表記が異なります。該当サイズの公式ページを確認してください。",
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
