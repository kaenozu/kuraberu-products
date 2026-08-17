// 標準記事レイアウト（docs/article-layout-v3-2026-08.md）の機械的定義。
// 購入 CTA の「何個・どこに置くか」の唯一の情報源で、
// 品質ゲート scripts/check-rendered-html.mjs と CTA コンポーネント
// （PurchaseCard / AffiliateButton）がここから値を導出する。
// レイアウトを変更するときはこのファイルだけを直す（ゲートは自動追随する）。

export const ARTICLE_LAYOUT = {
  // 購入 CTA を識別するマーカー属性の値（AffiliateButton が出力し、ゲートが探す）
  ctaEvent: "purchase",
  // PurchaseCard の placement prop が取り得る値
  placements: ["after-decision", "article-end"],
  // 診断結果カードのクリック計測用 placement（/tools/product-finder/ 配下）
  diagnosisPlacement: "diagnosis-result",
  // PurchaseCard の placement 省略時の既定値（v3 では末尾が原則）
  defaultPlacement: "article-end",
  // 標準記事の購入 CTA 構成（配置ごとの「商品1つにつき何枚」）。
  // v3 方針: 購入カードは原則「記事末尾 1 セット」。途中 CTA は長文記事のみ許容する。
  // 各配置に、記事で紹介する商品1つにつき1枚の購入カードを置く。
  // 商品数（productCount）は記事メタデータ（src/content/articles.ts）が持つため、
  // ここには枚数の絶対値ではなく商品あたり枚数を書く。
  // 比較記事（productCount=2）→ 末尾2枚、単一商品記事（productCount=1）→ 末尾1枚。
  ctaSets: [{ placement: "article-end", cardsPerProduct: 1 }],
  // 長文記事のみ許容する途中 CTA セット（同じく商品1つにつき1枚）。
  // 記事メタデータの midArticleCta: true が付いた記事にだけ適用される。
  midArticleSet: { placement: "after-decision", cardsPerProduct: 1 },
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
};

// 記事ごとに期待する購入 CTA 総数を、記事メタデータの商品数（productCount）と
// レイアウト定義（ctaSets / midArticleSet）から機械的に導出する。
// 例: 比較記事（productCount=2）→ 末尾1×2 = 2
//     長文の比較記事（midArticleCta）→ 末尾2 + 途中1×2 = 4
//     単一商品記事（productCount=1）→ 末尾1 = 1
export function expectedPurchaseCtasPerArticle(
  productCount,
  layout = ARTICLE_LAYOUT,
  { midArticleCta = false } = {},
) {
  if (!Number.isInteger(productCount) || productCount < 1) {
    throw new TypeError("productCount must be a positive integer");
  }
  let total = layout.ctaSets.reduce(
    (sum, set) => sum + set.cardsPerProduct * productCount,
    0,
  );
  if (midArticleCta && layout.midArticleSet) {
    total += layout.midArticleSet.cardsPerProduct * productCount;
  }
  return total;
}

// placement ごとの期待枚数を返す（ゲートが actual と照合する）。
// v3 では article-end は常に商品数分、after-decision は長文記事のみ商品数分。
export function expectedPlacementCounts(
  productCount,
  layout = ARTICLE_LAYOUT,
  { midArticleCta = false } = {},
) {
  if (!Number.isInteger(productCount) || productCount < 1) {
    throw new TypeError("productCount must be a positive integer");
  }
  const counts = {};
  for (const set of layout.ctaSets) {
    counts[set.placement] = set.cardsPerProduct * productCount;
  }
  if (midArticleCta && layout.midArticleSet) {
    counts[layout.midArticleSet.placement] =
      layout.midArticleSet.cardsPerProduct * productCount;
  }
  return counts;
}
