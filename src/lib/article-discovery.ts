import type { ArticleMetadata } from "../content/articles";
import { comparisonSubjects } from "./article-subjects";

/**
 * 記事検索（比較記事一覧）の仕様の単一情報源。
 *
 * - 本番では src/pages/articles/index.astro が normalizeDiscoveryText を
 *   サーバーサイドで使い、記事カードの data-search 属性を正規化する。
 * - クライアント側の絞り込みは public/scripts/article-discovery.js が行う。
 *   public/ 配下の素のJSは Astro バンドルを通らないため、このTS実装を import
 *   できない。そのため、クライアントJSの normalize はこのモジュールと同一の
 *   仕様（NFKC → toLocaleLowerCase('ja-JP') → trim → 空白正規化）に保つこと。
 *   変更時は必ず両方と tests/article-discovery.test.ts を同期させる。
 */
export interface ArticleDiscoveryState {
  query: string;
  category?: string;
  tag?: string;
}

/**
 * 同義語辞書。ユーザーが使う一般的な語を記事の専門用語に展開する。
 * クライアント側 (article-discovery.js) と同一の内容に保つこと。
 * （同期不変条件は tests/article-discovery-parity.test.ts が検証する）
 */
export const SYNONYMS: ReadonlyMap<string, readonly string[]> = new Map([
  ["軽い", ["軽量", "重量"]],
  ["重い", ["重量"]],
  ["静か", ["静音", "騒音"]],
  ["うるさい", ["騒音"]],
  ["小さい", ["コンパクト", "幅", "奥行"]],
  ["大きい", ["容量"]],
  ["手入れ", ["洗浄", "掃除", "お手入れ"]],
  ["きれい", ["洗浄"]],
  ["暖かい", ["保温"]],
  ["冷たい", ["保冷"]],
  ["安全", ["耐熱"]],
  ["丈夫", ["耐久"]],
  ["便利", ["便利"]],
  ["安い", ["価格"]],
  ["高い", ["価格"]],
  ["広い", ["容量", "幅"]],
  ["狭い", ["寸法"]],
  ["片付け", ["収納"]],
]);

export function expandWithSynonyms(text: string): string {
  const normalized = normalizeDiscoveryText(text);
  const expanded: string[] = [normalized];
  for (const [key, synonyms] of SYNONYMS) {
    if (normalized.includes(key)) {
      expanded.push(...synonyms);
    }
  }
  return expanded.join(" ");
}

export function normalizeDiscoveryText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .trim()
    .replace(/\s+/g, " ");
}

export function matchesArticle(
  article: ArticleMetadata,
  state: ArticleDiscoveryState,
): boolean {
  if (state.category && article.category !== state.category) return false;
  if (state.tag && !article.tags.includes(state.tag)) return false;
  const query = normalizeDiscoveryText(state.query);
  if (!query) return true;
  // 型番・ライン名（カードの card-subjects 行）も検索対象に含める。
  // 型番が headline に登場しない記事（例: 日立 BD-SX130K vs BD-STX130K）でも
  // モデル番号検索が成立するようにする。クライアント側（article-discovery.js の
  // articleSearchText）と同一のフィールド集合に保つこと。
  const subjects = comparisonSubjects(article) ?? [];
  const haystack = normalizeDiscoveryText(
    [
      article.title,
      article.headline,
      article.summary,
      article.category,
      ...article.tags,
      ...article.audiences,
      ...article.uses,
      ...subjects,
    ].join(" "),
  );
  const expandedQuery = expandWithSynonyms(query);
  return expandedQuery.split(" ").every((term) => haystack.includes(term));
}

export function parseDiscoveryState(
  params: URLSearchParams,
  validCategories: readonly string[],
  validTags: readonly string[],
): ArticleDiscoveryState {
  const category = params.get("category")?.normalize("NFKC").trim();
  const tag = params.get("tag")?.normalize("NFKC").trim();
  return {
    query: params.get("q")?.slice(0, 100) ?? "",
    category:
      category && validCategories.includes(category) ? category : undefined,
    tag: tag && validTags.includes(tag) ? tag : undefined,
  };
}

export function discoverySearchParams(
  state: ArticleDiscoveryState,
): URLSearchParams {
  const params = new URLSearchParams();
  const query = state.query.trim();
  if (query) params.set("q", query);
  if (state.category) params.set("category", state.category);
  if (state.tag) params.set("tag", state.tag);
  return params;
}
