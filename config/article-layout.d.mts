export interface ArticleCtaSet {
  placement: string;
  cards: number;
}

export interface ArticleLayout {
  ctaEvent: string;
  placements: readonly string[];
  defaultPlacement: string;
  ctaSets: readonly ArticleCtaSet[];
}

export const ARTICLE_LAYOUT: ArticleLayout;

export function expectedPurchaseCtasPerArticle(layout?: ArticleLayout): number;
