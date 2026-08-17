export interface ArticleCtaSet {
  placement: string;
  cardsPerProduct: number;
}

export interface ArticleLayout {
  ctaEvent: string;
  placements: readonly string[];
  /** 診断結果カードのクリック計測用 placement（/tools/product-finder/ 配下） */
  diagnosisPlacement: string;
  defaultPlacement: string;
  ctaSets: readonly ArticleCtaSet[];
  /** 長文記事のみ許容する途中 CTA セット（midArticleCta が付いた記事に適用） */
  midArticleSet: ArticleCtaSet;
  /** 記事末尾の「関連する比較記事」（同カテゴリ）の最大件数 */
  relatedArticlesLimit: number;
}

export const ARTICLE_LAYOUT: ArticleLayout;

export function expectedPurchaseCtasPerArticle(
  productCount: number,
  layout?: ArticleLayout,
  options?: { midArticleCta?: boolean },
): number;

export function expectedPlacementCounts(
  productCount: number,
  layout?: ArticleLayout,
  options?: { midArticleCta?: boolean },
): Record<string, number>;
