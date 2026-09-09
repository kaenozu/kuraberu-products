// 関連記事セクション検査（#702 で分離）。

import { ARTICLE_PAGE_PATTERN } from "./article-sections.mjs";
import { ARTICLE_LAYOUT } from "../../config/article-layout.mjs";

export function countRelatedArticleCards(html) {
  const section = html.match(
    /<section\b[^>]*aria-labelledby="related-heading"[^>]*>([\s\S]*?)<\/section\s*>/i,
  );
  if (!section) return 0;
  const cards = section[1].match(
    /<article\b[^>]*class="[^"]*\barticle-list-card\b[^"]*"[^>]*>/g,
  );
  return cards?.length ?? 0;
}

// 記事末尾の「ほかの比較記事」のリンク件数を数える。
// セクションは RelatedArticles.astro が aria-labelledby="others-heading" で
// 出力するため、その中にある .related-links の <li> を数える。
export function countOtherArticleLinks(html) {
  const section = html.match(
    /<section\b[^>]*aria-labelledby="others-heading"[^>]*>([\s\S]*?)<\/section\s*>/i,
  );
  if (!section) return 0;
  const items = section[1].match(/<li\b[^>]*>/gi);
  return items?.length ?? 0;
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
