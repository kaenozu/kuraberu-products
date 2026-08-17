// src/lib/related-articles.ts
//
// 記事末尾の「関連する比較記事」を、同カテゴリの先頭 n 件ではなく
// 関連性スコア（用途・タグ・検索意図・カテゴリの一致度）で選ぶ。
// 重みと上限は config/article-layout.mjs の relatedSelection が唯一の情報源で、
// RelatedArticles.astro と品質ゲートがここを経由する。
//
// 方針（docs/article-layout-v3-2026-08.md）:
// - 用途（uses）・製品タイプ（tags）・検索意図（audiences）の一致が主信号
// - 同カテゴリ一致は補助信号（+category）
// - ブランド名タグ（パナソニック など）は一致しても弱信号（brandTagWeight）。
//   ブランド同一性だけで「関連」と表示しない。

import { ARTICLE_LAYOUT } from "../../config/article-layout.mjs";

export interface RelatedSelectionOptions {
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

export interface RelatedSelection<
  T extends RelatedArticleCandidate = RelatedArticleCandidate,
> {
  related: T[];
  others: T[];
} /** 関連選択に必要な最小限の記事形状（ArticleMetadata は構造的に互換）。 */
export interface RelatedArticleCandidate {
  path: string;
  category: string;
  tags: readonly string[];
  audiences: readonly string[];
  uses: readonly string[];
  publishedAt: string;
}

/** 記事 A から見た記事 B の関連性スコアを返す。 */
export function scoreArticleRelevance(
  current: Pick<
    RelatedArticleCandidate,
    "tags" | "audiences" | "uses" | "category"
  >,
  candidate: Pick<
    RelatedArticleCandidate,
    "tags" | "audiences" | "uses" | "category"
  >,
  options: RelatedSelectionOptions = ARTICLE_LAYOUT.relatedSelection,
): number {
  let score = 0;
  for (const tag of candidate.tags) {
    if (!current.tags.includes(tag)) continue;
    score += options.brandTags.includes(tag)
      ? options.brandTagWeight
      : options.weights.tag;
  }
  for (const use of candidate.uses) {
    if (current.uses.includes(use)) score += options.weights.use;
  }
  for (const audience of candidate.audiences) {
    if (current.audiences.includes(audience)) {
      score += options.weights.audience;
    }
  }
  if (candidate.category === current.category) {
    score += options.weights.category;
  }
  return score;
}

function compareByScoreThenNewest<T extends RelatedArticleCandidate>(
  a: { article: T; score: number },
  b: { article: T; score: number },
  currentCategory: string,
): number {
  if (b.score !== a.score) return b.score - a.score;
  // 同点は同じカテゴリを優先する。ブランド名タグ一致（弱信号）だけで
  // 他カテゴリの記事が「関連」に割り込まないようにするため。
  const aSameCategory = a.article.category === currentCategory ? 0 : 1;
  const bSameCategory = b.article.category === currentCategory ? 0 : 1;
  if (aSameCategory !== bSameCategory) return aSameCategory - bSameCategory;
  if (a.article.publishedAt !== b.article.publishedAt) {
    // 新しい記事を優先（publishedAt は YYYY-MM-DD のため文字列比較でよい）
    return a.article.publishedAt < b.article.publishedAt ? 1 : -1;
  }
  if (a.article.path !== b.article.path) {
    return a.article.path < b.article.path ? -1 : 1;
  }
  return 0;
}

/**
 * 記事一覧から現在の記事（currentPath）に対する関連記事を選ぶ。
 * - 現在記事がメタデータに無いページ（/tools/product-finder/ 等）は、
 *   従来どおり同カテゴリを上限件数で返す（カテゴリフォールバック）。
 * - それ以外はスコア順で上位を related、残りを others として返す。
 */
export function selectRelatedArticles<T extends RelatedArticleCandidate>(
  articles: readonly T[],
  currentPath: string,
  currentCategory: string,
  options: RelatedSelectionOptions = ARTICLE_LAYOUT.relatedSelection,
): RelatedSelection<T> {
  const current = articles.find((article) => article.path === currentPath);
  const candidates = articles.filter((article) => article.path !== currentPath);

  if (!current) {
    const related = candidates
      .filter((article) => article.category === currentCategory)
      .slice(0, options.limit);
    const others = candidates
      .filter((article) => article.category !== currentCategory)
      .slice(0, options.othersLimit);
    return { related, others };
  }

  const scored = candidates.map((article) => ({
    article,
    score: scoreArticleRelevance(current, article, options),
  }));
  scored.sort((a, b) => compareByScoreThenNewest(a, b, current.category));

  const related = scored
    .filter(({ score }) => score >= options.minScore)
    .slice(0, options.limit)
    .map(({ article }) => article);
  const relatedPaths = new Set(related.map((article) => article.path));
  const others = scored
    .filter(({ article }) => !relatedPaths.has(article.path))
    .slice(0, options.othersLimit)
    .map(({ article }) => article);
  return { related, others };
}

/** 設定のブランド名タグが記事タグに存在するか（朽ちた設定の検出）。 */
export function findUnusedBrandTags(
  articles: readonly RelatedArticleCandidate[],
  options: RelatedSelectionOptions = ARTICLE_LAYOUT.relatedSelection,
): string[] {
  const usedTags = new Set(articles.flatMap((article) => article.tags));
  return options.brandTags.filter((tag) => !usedTags.has(tag));
}
