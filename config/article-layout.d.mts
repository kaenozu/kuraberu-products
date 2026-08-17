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
}

export const ARTICLE_LAYOUT: ArticleLayout;

export function expectedPurchaseCtasPerArticle(
  productCount: number,
  layout?: ArticleLayout,
): number;
