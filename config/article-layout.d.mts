export interface ArticleCtaSet {
  placement: string;
  cardsPerProduct: number;
  /** 比較記事のみに適用するセット（例: 結論直後の next-step ブロック） */
  comparisonOnly?: boolean;
}

export interface RelatedSelectionConfig {
  /** 「関連する比較記事」の最大件数 */
  limit: number;
  /** 「ほかの比較記事」の最大件数 */
  othersLimit: number;
  /** 関連セクションに載せる最低スコア */
  minScore: number;
  weights: {
    tag: number;
    use: number;
    audience: number;
    category: number;
  };
  /** ブランド名タグの一致スコア（弱信号） */
  brandTagWeight: number;
  /** 弱信号として扱うブランド名タグ */
  brandTags: readonly string[];
}

export interface ArticleLayout {
  ctaEvent: string;
  placements: readonly string[];
  /** 診断結果カードのクリック計測用 placement（/tools/product-finder/ 配下） */
  diagnosisPlacement: string;
  /** 診断ページのイベント名（/api/events が受け付ける許可リスト） */
  diagnosisEvents: readonly string[];
  defaultPlacement: string;
  ctaSets: readonly ArticleCtaSet[];
  /** 長文記事のみ許容する途中 CTA セット（midArticleCta が付いた記事に適用） */
  midArticleSet: ArticleCtaSet;
  /** 記事末尾の関連記事の選定ルール（関連性スコアベース） */
  relatedSelection: RelatedSelectionConfig;
  /** 記事のコンテンツタイプ定義（商品ガイド / 比較記事） */
  contentTypes: ContentTypeConfig;
  /** トップページ（カテゴリ入口・「よく比較される商品」）の構成 */
  topPage: TopPageConfig;
}

export interface ContentTypeConfig {
  /** 単一商品記事（productCount = 1）＝ 商品ガイド */
  guide: { maxProductCount: 1; label: string };
  /** 複数商品比較（productCount >= 2）＝ 比較記事 */
  comparison: { minProductCount: 2; label: string };
}

export interface TopPageConfig {
  /** 「よく比較される商品」としてトップに出す比較記事パス（3〜6件） */
  featuredPaths: readonly string[];
  /** トップのカテゴリ入口に載せる最低記事数 */
  categoryMinArticles: number;
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

export function contentTypeFor(
  productCount: number,
  layout?: ArticleLayout,
): "guide" | "comparison";
