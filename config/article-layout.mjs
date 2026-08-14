// 標準記事レイアウト（docs/article-layout-v2-2026-08.md）の機械的定義。
// 購入 CTA の「何個・どこに置くか」の唯一の情報源で、
// 品質ゲート scripts/check-rendered-html.mjs と CTA コンポーネント
// （PurchaseCard / AffiliateButton）がここから値を導出する。
// レイアウトを変更するときはこのファイルだけを直す（ゲートは自動追随する）。

export const ARTICLE_LAYOUT = {
  // 購入 CTA を識別するマーカー属性の値（AffiliateButton が出力し、ゲートが探す）
  ctaEvent: "purchase",
  // PurchaseCard の placement prop が取り得る値
  placements: ["after-decision", "article-end"],
  // PurchaseCard の placement 省略時の既定値
  defaultPlacement: "after-decision",
  // 標準比較記事の購入 CTA 構成（配置ごとの枚数）。
  // 全記事に「判断後」1セット（2商品比較）+「記事末尾」1セットを配置する。
  ctaSets: [
    { placement: "after-decision", cards: 2 },
    { placement: "article-end", cards: 2 },
  ],
};

// 標準記事に期待する購入 CTA 総数を ctaSets から機械的に導出する。
// 例: [{placement: "after-decision", cards: 2}, {placement: "article-end", cards: 2}] → 4
export function expectedPurchaseCtasPerArticle(layout = ARTICLE_LAYOUT) {
  return layout.ctaSets.reduce((total, set) => total + set.cards, 0);
}
