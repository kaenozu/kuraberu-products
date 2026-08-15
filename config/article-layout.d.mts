export interface ArticleCtaSet {
  placement: string;
  cardsPerProduct: number;
}

export interface ArticleLayout {
  ctaEvent: string;
  placements: readonly string[];
  defaultPlacement: string;
  ctaSets: readonly ArticleCtaSet[];
}

export const ARTICLE_LAYOUT: ArticleLayout;

export function expectedPurchaseCtasPerArticle(
  productCount: number,
  layout?: ArticleLayout,
): number;
