import type { ArticleMetadata } from "../content/articles";

export interface ArticleDiscoveryState {
  query: string;
  category?: string;
  tag?: string;
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
  const haystack = normalizeDiscoveryText(
    [
      article.title,
      article.headline,
      article.summary,
      article.category,
      ...article.tags,
      ...article.audiences,
      ...article.uses,
    ].join(" "),
  );
  return query.split(" ").every((term) => haystack.includes(term));
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
