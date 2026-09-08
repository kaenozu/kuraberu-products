/**
 * scripts/validators/pages.mjs
 *
 * 関連記事・トップページのゲート。セクション切り出しは DOM ベース。
 */
import { ARTICLE_LAYOUT } from "../../config/article-layout.mjs";
import { ARTICLE_PAGE_PATTERN } from "./sections.mjs";
import { parseDocument } from "./html-dom.mjs";

// 記事末尾の「関連する比較記事」のカード件数を数える。
// セクションは RelatedArticles.astro が aria-labelledby="related-heading" で
// 出力するため、その中にある .article-list-card を数える。
export function countRelatedArticleCards(html) {
  const root = parseDocument(html);
  const section = root.querySelector(
    'section[aria-labelledby="related-heading"]',
  );
  if (!section) return 0;
  return section.querySelectorAll("article.article-list-card").length;
}

// 記事末尾の「ほかの比較記事」のリンク件数を数える。
// セクションは RelatedArticles.astro が aria-labelledby="others-heading" で
// 出力するため、その中にある .related-links の <li> を数える。
export function countOtherArticleLinks(html) {
  const root = parseDocument(html);
  const section = root.querySelector(
    'section[aria-labelledby="others-heading"]',
  );
  if (!section) return 0;
  return section.querySelectorAll("li").length;
}

// 記事ページの関連記事セクションが config/article-layout.mjs の
// relatedSelection（limit / othersLimit）を超えないことを検証する。
// 件数の唯一の情報源は config（コンポーネントもここから slice する）。
export function validateRelatedArticleSection(relative, html) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const errors = [];
  const relatedCount = countRelatedArticleCards(html);
  const relatedLimit = ARTICLE_LAYOUT.relatedSelection.limit;
  if (relatedCount > relatedLimit) {
    errors.push(
      `${relative}: related comparison articles exceed the limit: found ${relatedCount}, maximum is ${relatedLimit} (per config/article-layout.mjs)`,
    );
  }
  const othersCount = countOtherArticleLinks(html);
  const othersLimit = ARTICLE_LAYOUT.relatedSelection.othersLimit;
  if (othersCount > othersLimit) {
    errors.push(
      `${relative}: other comparison articles exceed the limit: found ${othersCount}, maximum is ${othersLimit} (per config/article-layout.mjs)`,
    );
  }
  return errors;
}

// トップページ（dist/index.html）のカテゴリ入口を検証する。
// 各カテゴリリンクの category 値が、比較記事一覧（dist/articles/index.html）の
// カテゴリ select の option に必ず存在することを照合する（カテゴリ名の実在性）。
// 件数・掲載カテゴリの完全一致は config（topPage.categoryMinArticles）と
// articleMetadata の両方に依存するため、実ビルド整合テスト
// （tests/top-page.test.ts）が担う。
export function validateTopPageCategories(topHtml, articlesIndexHtml) {
  const errors = [];
  const categoryLinks = [
    ...topHtml.matchAll(/href="\/articles\/\?category=([^"]+)"/g),
  ].map((match) => decodeURIComponent(match[1]));
  const knownCategories = [
    ...articlesIndexHtml.matchAll(/<option value="([^"]+)">/g),
  ].map((match) => match[1]);
  if (!knownCategories.length) {
    errors.push(
      "top page: cannot validate categories: no category options found in /articles/",
    );
    return errors;
  }
  for (const category of categoryLinks) {
    if (!knownCategories.includes(category)) {
      errors.push(
        `top page: category entry points to an unknown category: ${category}`,
      );
    }
  }
  return errors;
}

// トップページ（dist/index.html）の新着比較セクションを検証する。
export function validateTopPageLatest(topHtml) {
  return /<section\b[^>]*data-top-latest[^>]*>[\s\S]*?<\/section\s*>/i.test(
    topHtml,
  )
    ? []
    : ["top page: missing data-top-latest section"];
}
