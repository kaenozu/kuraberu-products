import type { ArticleMetadata } from "../content/articles";

/** 記事一覧（/articles/ と /articles/page/N/）の1ページあたり記事数。 */
export const ARTICLE_LIST_PAGE_SIZE = 12;

/** 公開記事を modifiedAt の降順に並べ替える（一覧・ページネーション・sitemap 共通）。 */
export function sortByModifiedAtDesc(
  articles: readonly ArticleMetadata[],
): ArticleMetadata[] {
  return [...articles].sort((a, b) =>
    a.modifiedAt < b.modifiedAt ? 1 : a.modifiedAt > b.modifiedAt ? -1 : 0,
  );
}

/** ISO 日付文字列（YYYY-MM-DD）の最大値を返す。空配列は undefined。 */
export function maxDate(dates: readonly string[]): string | undefined {
  return dates.reduce<string | undefined>(
    (latest, date) => (latest === undefined || date > latest ? date : latest),
    undefined,
  );
}
