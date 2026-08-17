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
  // 診断結果カードのクリック計測用 placement（/tools/product-finder/ 配下）
  diagnosisPlacement: "diagnosis-result",
  // PurchaseCard の placement 省略時の既定値
  defaultPlacement: "after-decision",
  // 標準記事の購入 CTA 構成（配置ごとの「商品1つにつき何枚」）。
  // 各配置に、記事で紹介する商品1つにつき1枚の購入カードを置く。
  // 商品数（productCount）は記事メタデータ（src/content/articles.ts）が持つため、
  // ここには枚数の絶対値ではなく商品あたり枚数を書く。
  // 比較記事（productCount=2）→ 各配置2枚、単一商品記事（productCount=1）→ 各配置1枚。
  ctaSets: [
    { placement: "after-decision", cardsPerProduct: 1 },
    { placement: "article-end", cardsPerProduct: 1 },
  ],
};

// 記事ごとに期待する購入 CTA 総数を、記事メタデータの商品数（productCount）と
// レイアウト定義（ctaSets）から機械的に導出する。
// 例: 比較記事（productCount=2）→ 1×2 + 1×2 = 4
//     単一商品記事（productCount=1）→ 1×1 + 1×1 = 2
export function expectedPurchaseCtasPerArticle(
  productCount,
  layout = ARTICLE_LAYOUT,
) {
  if (!Number.isInteger(productCount) || productCount < 1) {
    throw new TypeError("productCount must be a positive integer");
  }
  return layout.ctaSets.reduce(
    (total, set) => total + set.cardsPerProduct * productCount,
    0,
  );
}
