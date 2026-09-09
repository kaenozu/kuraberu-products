/**
 * scripts/validators/meta.mjs
 *
 * 記事メタ読み取り（BaseLayout が出力する meta タグ）と
 * 購入リンク状態・コンテンツタイプのゲート。
 * meta タグ読み取りは querySelector ベース（属性順序に依存しない）。
 */
import { contentTypeFor } from "../../config/article-layout.mjs";
import { ARTICLE_PAGE_PATTERN } from "./sections.mjs";
import { parseDocument } from "./html-dom.mjs";

function metaContent(html, name) {
  const root = parseDocument(html);
  const meta = root.querySelector(`meta[name="${name}"]`);
  return meta?.getAttribute("content") ?? null;
}

// 記事ページの商品数を、BaseLayout が出力する
// <meta name="article:product-count" content="N"> から読み取る。
// 商品数の唯一の情報源は記事メタデータ（src/content/articles.ts の productCount）。
// 記事ページなのに meta が無い・値が不正な場合は null を返し、エラーを errors に積む。
export function readArticleProductCount(relative, html, errors) {
  const value = metaContent(html, "article:product-count");
  if (value === null) {
    errors.push(
      `${relative}: missing article:product-count meta (productCount in src/content/articles.ts is not rendered)`,
    );
    return null;
  }
  const productCount = Number(value);
  if (!Number.isInteger(productCount) || productCount < 1) {
    errors.push(
      `${relative}: invalid article:product-count "${value}" (must be a positive integer)`,
    );
    return null;
  }
  return productCount;
}

// 記事の購入リンク状態を
// <meta name="article:purchase-link-status" content="verified|unverified"> から読み取る。
export function readArticlePurchaseLinkStatus(_relative, html) {
  return metaContent(html, "article:purchase-link-status");
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
  const value = metaContent(html, "article:content-type");
  if (value === null) {
    errors.push(`${relative}: missing article:content-type meta`);
    return null;
  }
  return value;
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

const LEGACY_HERO_TRUST = "公式情報確認済み · ";
const LEGACY_AD_NOTICE = "広告表示：この記事には広告リンクを含みます";

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
