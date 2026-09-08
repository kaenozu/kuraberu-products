/**
 * scripts/validators/sections.mjs
 *
 * 記事セクションの順序・有無ゲート。
 * セクションマーカーの正規表現は従来どおり（単純な存在検査のため
 * 自作トークナイザは使っていない）。期待順序の唯一の情報源は
 * config/article-layout.mjs の sectionOrder。
 */
import {
  ARTICLE_LAYOUT,
  requiredSectionIds,
} from "../../config/article-layout.mjs";

export const ARTICLE_PAGE_PATTERN = /^articles\/[^/]+\/index\.html$/;

// 記事テンプレートのセクション順序契約（config/article-layout.mjs の sectionOrder）。
// 実ビルド済み HTML からセクションマーカーの出現位置を抽出し、
// 定義された順序と照合する。順序違反は error として報告する。
export const SECTION_MARKERS = {
  meta: /<p class="meta">/,
  h1: /<h1[^>]*>/,
  lead: /<p class="lead">/,
  "jump-nav": /<nav class="jump-nav"/,
  "comparison-v2": /<section[^>]*class="[^"]*\barticle-comparison-v2/,
  specs: /<details[^>]*id="specs"/,
  official: /<h2 id="official">/,
  "trust-line": /<p class="trust-line">/,
  "next-step": /<section[^>]*data-next-step/,
  faq: /<h2 id="faq">/,
  "purchase-cards": /<div class="purchase-cards">/,
  "change-log": /<ol class="change-log">/,
  "source-list": /<ul class="source-list">/,
};

// 比較記事テンプレート（productCount >= 2）のみがセクション契約の対象。
// 商品ガイドは別テンプレートのため対象外（既存の順序ゲートと同じスコープ）。
function readComparisonContentType(html) {
  return (
    html.match(
      /<meta name="article:content-type" content="(guide|comparison)">/i,
    )?.[1] ?? null
  );
}

export function validateArticleSectionOrder(relative, html) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  if (readComparisonContentType(html) !== "comparison") return [];
  const template = detectArticleTemplate(html);
  if (template === null) return [];
  const order = ARTICLE_LAYOUT.sectionOrder?.[template];
  if (!order) return [];
  const errors = [];

  const positions = [];
  for (const { id } of order) {
    const re = SECTION_MARKERS[id];
    if (!re) continue;
    const match = html.match(re);
    if (match) {
      positions.push({ id, pos: match.index });
    }
  }

  positions.sort((a, b) => a.pos - b.pos);
  // 商用テンプレートは公式ソースの有無で2つの正当な変種がある:
  // - hero あり（details.fold-section.source-note が存在）:
  //     TrustLine も NextStepBlock も ArticleComparisonV2 内部に含まれ、
  //     内部実装上の順序は next-step → trust-line
  // - hero なし: TrustLine → 独立 NextStepBlock の順（設定どおり）
  // このため commercialPage の trust-line↔next-step の相対順序は変種依存であり、
  // 線形な sectionOrder では表現できない。両セクションの「存在」は
  // validateRequiredSections が別途 fail-closed で保証するため、ここでは
  // このペアに限って順序照合をスキップする（docs/rendered-gate-allowlist.md 参照）。
  const flexiblePairs =
    template === "commercialPage" ? [["trust-line", "next-step"]] : [];
  const isFlexiblePair = (a, b) =>
    flexiblePairs.some(
      ([x, y]) => (a === x && b === y) || (a === y && b === x),
    );
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    const prevIndex = order.findIndex((s) => s.id === prev.id);
    const currIndex = order.findIndex((s) => s.id === curr.id);
    if (prevIndex > currIndex && !isFlexiblePair(prev.id, curr.id)) {
      errors.push(
        relative +
          ": section " +
          JSON.stringify(curr.id) +
          " appears before " +
          JSON.stringify(prev.id) +
          " (expected order: " +
          prev.id +
          " → " +
          curr.id +
          ")",
      );
    }
  }

  return errors;
}

/**
 * 記事ページのテンプレート種別を HTML のマーカーから導出する
 * （config/article-layout.mjs sectionOrder のキー名）。
 * - CommercialArticlePage 出力（公式の確認先 details.fold-section.source-note
 *   を持つ。ArticleComparisonV2 を内包するため v2 マーカーだけでは判別できない）
 *   → commercialPage（自動生成比較記事）
 * - 上記以外で ArticleComparisonV2 セクションあり → comparisonPage（手書き比較記事）
 * - NextStepBlock のみあり → commercialPage
 * - どちらも無い（商品ガイド等） → null（セクション契約の対象外）
 */
export function detectArticleTemplate(html) {
  const hasCommercialSourceNote =
    /<details\b[^>]*class="[^"]*\bfold-section\b[^"]*\bsource-note\b/.test(
      html,
    );
  if (hasCommercialSourceNote) return "commercialPage";
  const hasComparisonV2 = /class="[^"]*\barticle-comparison-v2\b/.test(html);
  const hasNextStep = /data-next-step/.test(html);
  if (hasComparisonV2) return "comparisonPage";
  if (hasNextStep) return "commercialPage";
  return null;
}

// Issue #343: 全生成記事ページへ拡大した品質ゲート。
// 「required: true」のセクションが欠落していないことを、テンプレート種別ごとに
// config/article-layout.mjs の sectionOrder から検証する（順序は既存ゲート、
// 有無はこのゲートが担う）。エラーには許可リスト照合用のルールタグ
// [required-section:<id>] を付与する。
export function validateRequiredSections(relative, html) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  if (readComparisonContentType(html) !== "comparison") return [];
  const template = detectArticleTemplate(html);
  if (template === null) return [];
  const order = ARTICLE_LAYOUT.sectionOrder?.[template];
  if (!order) return [];
  const errors = [];
  for (const id of requiredSectionIds(template)) {
    const marker = SECTION_MARKERS[id];
    // マーカー未定義のセクションは順序ゲート同様に検査できないためスキップ
    if (!marker) continue;
    if (!marker.test(html)) {
      errors.push(
        `${relative}: [required-section:${id}] required section "${id}" is missing (per config/article-layout.mjs sectionOrder.${template})`,
      );
    }
  }
  return errors;
}
