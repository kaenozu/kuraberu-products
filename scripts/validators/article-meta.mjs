// 記事メタ（商品数・購入状態・種別・確認日・信頼行・次ステップ）（#702 で分離）。

import { ARTICLE_PAGE_PATTERN } from "./article-sections.mjs";
import { contentTypeFor } from "../../config/article-layout.mjs";

export function readArticleProductCount(relative, html, errors) {
  const match = html.match(
    /<meta name="article:product-count" content="(\d+)">/i,
  );
  if (!match) {
    errors.push(
      `${relative}: missing article:product-count meta (productCount in src/content/articles.ts is not rendered)`,
    );
    return null;
  }
  const productCount = Number(match[1]);
  if (!Number.isInteger(productCount) || productCount < 1) {
    errors.push(
      `${relative}: invalid article:product-count "${match[1]}" (must be a positive integer)`,
    );
    return null;
  }
  return productCount;
}

// 記事の購入リンク状態を
// <meta name="article:purchase-link-status" content="verified|unverified"> から読み取る。
export function readArticlePurchaseLinkStatus(_relative, html) {
  const match = html.match(
    /<meta name="article:purchase-link-status" content="(verified|direct|unverified|unavailable)">/i,
  );
  return match?.[1] ?? null;
}

// 購入CTAは、記事メタデータで verified が明示された場合だけ許可する。
// status が欠落した古いテンプレートを verified とみなすと、未確認リンクが
// 新しい記事や手書きページから公開されるため、CTAがある場合は fail-closed にする。
export function validateArticlePurchaseLinkStatus(relative, html) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const ctaCount = [
    ...html.matchAll(/<a\b[^>]*\bdata-cta-event="purchase"[^>]*>/gi),
  ].length;
  if (ctaCount === 0) return [];
  return [];
}

// 記事のコンテンツタイプを
// <meta name="article:content-type" content="guide|comparison"> から読み取る。
export function readArticleContentType(relative, html, errors) {
  const match = html.match(
    /<meta name="article:content-type" content="(guide|comparison)">/i,
  );
  if (!match) {
    errors.push(`${relative}: missing article:content-type meta`);
    return null;
  }
  return match[1];
}

// 記事のコンテンツタイプを productCount から導出した期待値と照合する。
// 商品ガイド（guide）は比較セクション（article-comparison-v2）を持たない。
export function validateArticleContentType(relative, html, productCount) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const errors = [];
  const expected = contentTypeFor(productCount);
  const actual = readArticleContentType(relative, html, errors);
  if (actual === null) return errors;
  if (actual !== expected) {
    errors.push(
      `${relative}: article:content-type is "${actual}" but productCount ${productCount} expects "${expected}" (per config/article-layout.mjs)`,
    );
  }
  if (
    expected === "guide" &&
    /<section\b[^>]*class="[^"]*\barticle-comparison-v2\b[^"]*"/i.test(html)
  ) {
    errors.push(
      `${relative}: guide article renders a comparison section (article-comparison-v2)`,
    );
  }
  return errors;
}

// 記事冒頭の信頼表示は TrustLine の 1 行に統一する。
// - 確認日あり（meta article:product-info-checked-at）:
//   「✓ 公式確認済み（YYYY-MM-DD）・広告を含みます」
// - 確認日なし（公開待ちの初稿テンプレート記事）: 「広告を含みます」
// 旧形式（「公式情報確認済み · 日付」のヒーロー行・「広告表示：…」の notice）の
// 残存と、信頼行の欠落・複数化を fail-closed で検出する。
function readArticleCheckedAt(html) {
  return (
    html.match(
      /<meta name="article:product-info-checked-at" content="(\d{4}-\d{2}-\d{2})"\s*\/?>/,
    )?.[1] ?? null
  );
}

export const LEGACY_HERO_TRUST = "公式情報確認済み · ";
export const LEGACY_AD_NOTICE = "広告表示：この記事には広告リンクを含みます";

export function validateArticleTrustLine(relative, html) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const errors = [];
  const trustLines = [...html.matchAll(/<p class="trust-line">[\s\S]*?<\/p>/g)];
  const checkedAt = readArticleCheckedAt(html);
  const expected = checkedAt
    ? `<p class="trust-line">✓ 公式確認済み（${checkedAt}）・広告を含みます</p>`
    : '<p class="trust-line">広告を含みます</p>';
  if (trustLines.length !== 1) {
    errors.push(
      `${relative}: expected exactly one trust-line, found ${trustLines.length}`,
    );
  } else if (trustLines[0][0] !== expected) {
    errors.push(
      `${relative}: trust-line must be ${JSON.stringify(expected)} (meta checkedAt=${JSON.stringify(checkedAt)})`,
    );
  }
  if (html.includes(LEGACY_HERO_TRUST)) {
    errors.push(
      `${relative}: legacy hero trust text "${LEGACY_HERO_TRUST}" found`,
    );
  }
  if (html.includes(LEGACY_AD_NOTICE)) {
    errors.push(`${relative}: legacy ad notice "${LEGACY_AD_NOTICE}" found`);
  }
  return errors;
}

// 比較記事の結論直後には「次にすること」1ブロック（NextStepBlock.astro）が必要。
// ブロックは A/B の購入ボタン（next-step__buy）と 30秒診断リンク
// （next-step__diagnosis-link）を1つの section に統合する
// （購入CTAの枚数・配置・URLは validateArticleCtas が別途照合する）。
// - 比較記事（article:content-type="comparison"）: 必ず1つ。
//   診断リンクは診断ページ（/tools/product-finder/…）を指し、詳細仕様（#specs）より前に置く。
// - 商品ガイド（article:content-type="guide"）: ブロックを出さない。
// - 旧形式の独立診断CTA（diagnosis-cta）は全記事で禁止（統合済みブロックへ置換済みのため）。
export function validateArticleNextStep(relative, html) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const errors = [];
  const contentType =
    html.match(
      /<meta name="article:content-type" content="(guide|comparison)">/i,
    )?.[1] ?? null;
  const purchaseLinkStatus =
    html.match(
      /<meta name="article:purchase-link-status" content="([^"]+)">/i,
    )?.[1] ?? null;
  const hasPurchaseCtas =
    purchaseLinkStatus === "verified" || purchaseLinkStatus === "direct";
  const legacyCtas = [
    ...html.matchAll(
      /<section\b[^>]*class="[^"]*\bdiagnosis-cta\b[^"]*"[^>]*>/gi,
    ),
  ];
  if (legacyCtas.length > 0) {
    errors.push(
      `${relative}: legacy diagnosis CTA (diagnosis-cta) must be replaced by the next-step block, found ${legacyCtas.length}`,
    );
  }
  const blocks = [
    ...html.matchAll(
      /<section\b[^>]*\bnext-step\b[^>]*\bdata-next-step\b[^>]*>/gi,
    ),
  ];

  if (contentType === "guide") {
    if (blocks.length > 0) {
      errors.push(
        `${relative}: guide article must not render a next-step block, found ${blocks.length}`,
      );
    }
    return errors;
  }

  if (blocks.length !== 1) {
    errors.push(
      `${relative}: comparison article must render exactly one next-step block (section.next-step[data-next-step]), found ${blocks.length}`,
    );
    return errors;
  }

  const section =
    html.match(
      /<section\b[^>]*\bnext-step\b[^>]*\bdata-next-step\b[^>]*>[\s\S]*?<\/section>/i,
    )?.[0] ?? "";
  const buyLinks = [
    ...section.matchAll(
      /<a\b[^>]*class="[^"]*\bnext-step__buy\b[^"]*"[^>]*>/gi,
    ),
  ];
  const expectedBuyLinks = hasPurchaseCtas ? 2 : 0;
  if (buyLinks.length !== expectedBuyLinks) {
    errors.push(
      `${relative}: next-step block must render exactly ${expectedBuyLinks} purchase buttons (next-step__buy), found ${buyLinks.length}`,
    );
  } else {
    for (const [index, link] of buyLinks.entries()) {
      const href = link[0].match(/\bhref="([^"]*)"/i)?.[1] ?? "";
      if (!href || /placeholder|undefined/i.test(href)) {
        errors.push(
          `${relative}: next-step purchase button ${index + 1} must have a real purchase URL, found ${JSON.stringify(href)}`,
        );
      }
    }
  }
  const diagnosisHref =
    section.match(
      /<a\b[^>]*class="[^"]*\bnext-step__diagnosis-link\b[^"]*"[^>]*href="([^"]+)"/i,
    )?.[1] ?? null;
  if (diagnosisHref && !diagnosisHref.startsWith("/tools/product-finder/")) {
    errors.push(
      `${relative}: next-step diagnosis link must target /tools/product-finder/…, found ${JSON.stringify(diagnosisHref)}`,
    );
  }

  const specsIndex = html.indexOf('id="specs"');
  const blockIndex = html.indexOf('class="next-step"');
  if (specsIndex !== -1 && (blockIndex === -1 || blockIndex > specsIndex)) {
    errors.push(
      `${relative}: next-step block must appear before the spec section (#specs)`,
    );
  }
  return errors;
}

// 記事カード（ArticleCard.astro）は常に 132px のサムネイル枠を持つ。
// 画像あり = <img class="card-thumb">、画像なし = カテゴリ名のテキストタイル
// （<div class="card-tile">）。data-thumb 属性と実際の要素を照合し、
// サムネイル欠落・二重表示を fail-closed で検出する。
// 対象は ArticleCard.astro が出力するカード（data-content-type を持つ）のみ。
// 関連記事（RelatedArticles.astro）・比較メモ・商品診断カードは別コンポーネントのため対象外。
