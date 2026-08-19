// 標準記事レイアウト（docs/article-layout-v3-2026-08.md）の機械的定義。
// 購入 CTA の「何個・どこに置くか」の唯一の情報源で、
// 品質ゲート scripts/check-rendered-html.mjs と CTA コンポーネント
// （PurchaseCard / AffiliateButton）がここから値を導出する。
// レイアウトを変更するときはこのファイルだけを直す（ゲートは自動追随する）。

export const ARTICLE_LAYOUT = {
  // 購入 CTA を識別するマーカー属性の値（AffiliateButton / NextStepBlock が出力し、ゲートが探す）
  ctaEvent: "purchase",
  // PurchaseCard / NextStepBlock の placement prop が取り得る値
  placements: ["article-end", "next-step"],
  // 診断結果カードのクリック計測用 placement（/tools/product-finder/ 配下）
  diagnosisPlacement: "diagnosis-result",
  // 診断ページのイベント名（/api/events が受け付ける）。仕様（Analytics 節）の
  // イベント群を定義し、レイアウト契約と同じくここが唯一の情報源。
  diagnosisEvents: [
    "diagnosis_view",
    "diagnosis_start",
    "diagnosis_complete",
    "diagnosis_restart",
    "result_article_click",
    "result_affiliate_click",
  ],
  // PurchaseCard の placement 省略時の既定値（v3 では末尾が原則）
  defaultPlacement: "article-end",
  // 標準記事の購入 CTA 構成（配置ごとの「商品1つにつき何枚」）。
  // v3 方針: 購入カードは原則「記事末尾 1 セット」。
  // 各配置に、記事で紹介する商品1つにつき1枚の購入カードを置く。
  // 商品数（productCount）は記事メタデータ（src/content/articles.ts）が持つため、
  // ここには枚数の絶対値ではなく商品あたり枚数を書く。
  // 比較記事（productCount=2）→ 末尾2枚、単一商品記事（productCount=1）→ 末尾1枚。
  // next-step: 結論直後の「次にすること」1ブロック（NextStepBlock.astro）の購入ボタン。
  // 比較記事のみ（comparisonOnly: true）で、商品ガイド（productCount=1）には出さない。
  // 購入カード本体（末尾の詳細カード）とは別のコンパクトなボタン。
  // （2026-08-18: v2 の途中 CTA = after-decision は、宣言する記事がゼロのまま経路ごと削除）
  ctaSets: [
    { placement: "article-end", cardsPerProduct: 1 },
    { placement: "next-step", cardsPerProduct: 1, comparisonOnly: true },
  ],
  // 記事末尾の関連記事の選定ルール（src/lib/related-articles.ts が実装）。
  // 同カテゴリの先頭 n 件ではなく、関連性スコア（用途・タグ・検索意図・カテゴリの一致度）で選ぶ。
  // - related  : スコア >= minScore の上位 limit 件を「関連する比較記事」として表示
  // - others   : 残りをスコア順で othersLimit 件「ほかの比較記事」として表示
  // - brandTags: ブランド名タグ（パナソニック 等）は一致しても brandTagWeight の弱信号。
  //   ブランド同一性だけで「関連」と表示せず、製品タイプ（紙おむつ/水筒 等）を優先する。
  relatedSelection: {
    limit: 4,
    othersLimit: 3,
    minScore: 1,
    weights: { tag: 3, use: 2, audience: 2, category: 1 },
    brandTagWeight: 1,
    brandTags: [
      "パンパース",
      "メリーズ",
      "ムーニー",
      "ピジョン",
      "ベビービョルン",
      "アップリカ",
      "コンビ",
      "タイガー",
      "パナソニック",
      "ティファール",
      "シャープ",
      "サーモス",
      "山崎実業",
      "山崎産業",
      "象印",
      "キングジム",
    ],
  },
  // 記事のコンテンツタイプ。productCount から機械的に導出する
  // （src/layouts/BaseLayout.astro が article:content-type meta として出力し、
  //  品質ゲート scripts/check-rendered-html.mjs が照合する）。
  // - 商品ガイド（guide）: productCount = 1 の単一商品記事。比較セクション
  //   （article-comparison-v2）を持たない。
  // - 比較記事（comparison）: productCount >= 2 の複数商品比較。
  contentTypes: {
    guide: { maxProductCount: 1, label: "商品ガイド" },
    comparison: { minProductCount: 2, label: "比較記事" },
  },
  // 記事テンプレートのセクション順序契約。
  // 品質ゲート scripts/check-rendered-html.mjs がここから期待値を導出し、
  // 実ビルド済み HTML のセクション出現順序と照合する。
  // 順序が変わったらこの定義だけ直す（ゲートは自動追随する）。
  // 各配列は HTML に出現する順序で、省略可能なセクションは mustAppear: false。
  sectionOrder: {
    // ArticleComparisonPage.astro（手動比較記事）のセクション順序。
    // ArticleComparisonV2 内部の HeroComparison / VisualKeyDifferences /
    // NextStepBlock / TrustLine はすべて article-comparison-v2 セクションに含まれる。
    comparisonPage: [
      { id: "meta", label: "ブランッド（カテゴリ・日付）", required: true },
      { id: "h1", label: "見出し", required: true },
      { id: "lead", label: "リード文", required: true },
      { id: "jump-nav", label: "ページ内ジャンプ", required: true },
      {
        id: "comparison-v2",
        label: "比較本文（結論・違い・次にすること・信頼）",
        required: true,
      },
      { id: "specs", label: "詳細仕様", required: true },
      { id: "official", label: "公式情報", required: false },
      { id: "faq", label: "よくある質問", required: true },
      { id: "purchase-cards", label: "購入カード", required: true },
      { id: "change-log", label: "更新履歴", required: true },
      { id: "source-list", label: "情報源一覧", required: true },
    ],
    // CommercialArticlePage.astro（自動生成比較記事）のセクション順序。
    commercialPage: [
      { id: "meta", label: "ブランッド（カテゴリ・日付）", required: true },
      { id: "h1", label: "見出し", required: true },
      { id: "trust-line", label: "信頼表示", required: true },
      { id: "next-step", label: "次にすること", required: true },
      { id: "faq", label: "よくある質問", required: true },
      { id: "purchase-cards", label: "購入カード", required: true },
      { id: "change-log", label: "更新履歴", required: true },
    ],
  },
  // トップページ（src/pages/index.astro）の構成。唯一の情報源で、
  // 品質ゲート scripts/check-rendered-html.mjs と実ビルド整合テスト
  // （tests/top-page.test.ts）がここから期待値を導出する。
  topPage: {
    // 「よく比較される商品」としてトップに出す比較記事（3〜4件）。
    // パスは articleMetadata に存在し、ゲートが件数と存在を検証する。
    // 意味の違う入口（人気・追加日）として、最近の比較セクションと併用する。
    featuredPaths: [
      "/articles/babybjorn-cradle/",
      "/articles/thermos-tiger-bottle/",
      "/articles/zojirushi-ck-pa08-vs-ck-dc08/",
      "/articles/panasonic-eh-na9m-vs-eh-na7m/",
    ],
    // トップのカテゴリ入口に載せる最低記事数（これ未満のカテゴリは非表示）。
    categoryMinArticles: 2,
  },
};

// 記事ごとに期待する購入 CTA 総数を、記事メタデータの商品数（productCount）と
// レイアウト定義（ctaSets）から機械的に導出する。
// 例: 比較記事（productCount=2）→ 末尾1×2 + next-step1×2 = 4
//     単一商品記事（productCount=1）→ 末尾1 = 1
export function expectedPurchaseCtasPerArticle(
  productCount,
  layout = ARTICLE_LAYOUT,
) {
  if (!Number.isInteger(productCount) || productCount < 1) {
    throw new TypeError("productCount must be a positive integer");
  }
  // comparisonOnly なセット（next-step）は商品ガイドには適用しない。
  const isComparison = contentTypeFor(productCount, layout) === "comparison";
  let total = 0;
  for (const set of layout.ctaSets) {
    if (set.comparisonOnly && !isComparison) continue;
    total += set.cardsPerProduct * productCount;
  }
  return total;
}

// 記事のコンテンツタイプ（"guide" / "comparison"）を productCount から導出する。
// 単一商品記事（productCount = 1）は「商品ガイド」、複数商品比較は「比較記事」。
export function contentTypeFor(productCount, layout = ARTICLE_LAYOUT) {
  if (!Number.isInteger(productCount) || productCount < 1) {
    throw new TypeError("productCount must be a positive integer");
  }
  if (productCount === layout.contentTypes.guide.maxProductCount) {
    return "guide";
  }
  return "comparison";
}

// placement ごとの期待枚数を返す（ゲートが actual と照合する）。
// v3 では article-end は常に商品数分、next-step は比較記事のみ商品数分。
export function expectedPlacementCounts(productCount, layout = ARTICLE_LAYOUT) {
  if (!Number.isInteger(productCount) || productCount < 1) {
    throw new TypeError("productCount must be a positive integer");
  }
  const isComparison = contentTypeFor(productCount, layout) === "comparison";
  const counts = {};
  for (const set of layout.ctaSets) {
    if (set.comparisonOnly && !isComparison) continue;
    counts[set.placement] = set.cardsPerProduct * productCount;
  }
  return counts;
}
