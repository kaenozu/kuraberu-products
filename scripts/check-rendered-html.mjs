import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_EXTERNAL_EMBEDS_PER_PAGE } from "./external-embed-limit.mjs";
import {
  ARTICLE_LAYOUT,
  contentTypeFor,
  expectedPlacementCounts,
  expectedPurchaseCtasPerArticle,
  requiredSectionIds,
} from "../config/article-layout.mjs";

function walk(directory, htmlFiles) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(current, htmlFiles);
    else if (current.endsWith(".html")) htmlFiles.push(current);
  }
}

function findTagEnd(source, start) {
  let quote = null;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      // HTML属性値ではバックスラッシュはエスケープ文字ではない。
      // バックスラッシュによるクォート無効化チェックは行わない。
      // サロゲートペアの末尾も正しく処理される。
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index + 1;
    }
  }
  return { end: source.length, closed: false };
}

function findTagEndWithStatus(source, start) {
  const tagEnd = findTagEnd(source, start);
  if (typeof tagEnd === "number") {
    return { end: tagEnd, closed: true };
  }
  return tagEnd;
}

function inspectAttributes(tag, tagName) {
  let index = 1 + tagName.length;
  while (index < tag.length) {
    while (/\s/.test(tag[index] ?? "")) index += 1;
    if (index >= tag.length || tag[index] === ">") {
      return { hasExternalEmbed: false, malformed: !tag.endsWith(">") };
    }
    if (tag[index] === "/") {
      if (tag[index + 1] === ">")
        return { hasExternalEmbed: false, malformed: false };
      index += 1;
      continue;
    }

    const nameStart = index;
    while (index < tag.length && !/[\s=/>]/.test(tag[index] ?? "")) {
      index += 1;
    }
    if (index === nameStart) {
      index += 1;
      continue;
    }
    const name = tag.slice(nameStart, index).toLowerCase();
    if (name === "data-external-embed") {
      return { hasExternalEmbed: true, malformed: !tag.endsWith(">") };
    }

    while (/\s/.test(tag[index] ?? "")) index += 1;
    if (tag[index] !== "=") continue;
    index += 1;
    while (/\s/.test(tag[index] ?? "")) index += 1;
    if (index >= tag.length) {
      return { hasExternalEmbed: false, malformed: true };
    }
    if (tag[index] === '"' || tag[index] === "'") {
      const quote = tag[index];
      index += 1;
      while (index < tag.length && tag[index] !== quote) index += 1;
      if (index >= tag.length) {
        return { hasExternalEmbed: false, malformed: true };
      }
      index += 1;
    } else {
      while (index < tag.length && !/[\s>]/.test(tag[index] ?? "")) {
        index += 1;
      }
    }
  }
  return { hasExternalEmbed: false, malformed: !tag.endsWith(">") };
}

function inspectRenderedExternalEmbeds(html) {
  let count = 0;
  let index = 0;
  let malformed = false;
  let malformedReason;

  while (index < html.length) {
    if (html.startsWith("<!--", index)) {
      const commentEnd = html.indexOf("-->", index + 4);
      if (commentEnd === -1) {
        malformed = true;
        malformedReason = "unterminated HTML comment";
      }
      index = commentEnd === -1 ? html.length : commentEnd + 3;
      continue;
    }
    if (html[index] !== "<") {
      index += 1;
      continue;
    }

    const tagMatch = html.slice(index).match(/^<([A-Za-z][\w:-]*)/);
    if (!tagMatch) {
      index += 1;
      continue;
    }

    const tagName = tagMatch[1].toLowerCase();
    const tagEndInfo = findTagEndWithStatus(html, index + tagMatch[0].length);
    const tag = html.slice(index, tagEndInfo.end);
    const isClosingTag = html[index + 1] === "/";

    if (!tagEndInfo.closed) malformed = true;
    if (!isClosingTag) {
      const attributes = inspectAttributes(tag, tagName);
      if (attributes.hasExternalEmbed) count += 1;
      if (attributes.malformed) malformed = true;
    }

    if (!isClosingTag && (tagName === "script" || tagName === "style")) {
      const closingTag = new RegExp(`<\\/${tagName}\\s*>`, "i").exec(
        html.slice(tagEndInfo.end),
      );
      if (!closingTag) malformed = true;
      index = closingTag ? tagEndInfo.end + closingTag.index : html.length;
      continue;
    }
    const nextIndex = tagEndInfo.end;
    index = nextIndex > index ? nextIndex : index + 1;
  }

  return { count, malformed, malformedReason };
}

export function countRenderedExternalEmbeds(html) {
  return inspectRenderedExternalEmbeds(html).count;
}

export function validateRenderedExternalEmbedCounts(
  files,
  maximum = MAX_EXTERNAL_EMBEDS_PER_PAGE,
) {
  return files.flatMap(({ filePath, html }) => {
    const result = inspectRenderedExternalEmbeds(html);
    const errors = result.malformed
      ? [
          `${filePath}: malformed rendered HTML while checking external embeds${
            result.malformedReason ? `: ${result.malformedReason}` : ""
          }`,
        ]
      : [];
    if (result.count > maximum) {
      errors.push(
        `${filePath}: rendered external embed limit exceeded: found ${result.count}, maximum is ${maximum}`,
      );
    }
    return errors;
  });
}

function internalTarget(href, distDirectory) {
  let pathname = href.split("#")[0].split("?")[0];
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    /* ignore malformed URIs */
  }
  if (!pathname || !pathname.startsWith("/")) return null;
  if (pathname === "/") return path.join(distDirectory, "index.html");
  if (path.extname(pathname)) return path.join(distDirectory, pathname);
  return path.join(distDirectory, pathname, "index.html");
}

const ARTICLE_PAGE_PATTERN = /^articles\/[^/]+\/index\.html$/;
// 記事テンプレートのセクション順序契約（config/article-layout.mjs の sectionOrder）。
// 実ビルド済み HTML からセクションマーカーの出現位置を抽出し、
// 定義された順序と照合する。順序違反は error として報告する。
const SECTION_MARKERS = {
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

// 未解決テンプレートトークンの検出（Issue #343）。
// {{ ... }} / ${ ... } / %UPPER_SNAKE% / [object Object] がレンダリング済み
// HTML に残っていることは生成壊れを意味する。inline script/style 内は
// JS テンプレートリテラルの正当な使用があるため走査対象から除外する。
// エラーには許可リスト照合用のルールタグ [template-token] を付与する。
const TEMPLATE_TOKEN_PATTERNS = [
  { pattern: /\{\{[^{}]{0,200}\}\}/, label: "{{...}}" },
  { pattern: /\$\{[^}]{0,200}\}/, label: "${...}" },
  // %TOKEN% は URL エンコード断片（%E3%81…）を誤検知しないよう
  // 内側 4 文字以上の大文字スネークケースに限定する（エンコードは常に 2 桁）。
  // ただし `%BB6142%` のように、エンコード済みバイト（%BB）へ
  // 商品番号が続く形もあるため、先頭2文字が16進数の断片は除外する。
  {
    pattern: /%(?![0-9A-F]{2}[A-Z0-9_])[A-Z][A-Z0-9_]{3,}%/,
    label: "%TOKEN%",
  },
  { pattern: /\[object Object\]/, label: "[object Object]" },
];

function stripScriptAndStyleContents(html) {
  return html.replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    (_match, tagName) => `<${tagName}></${tagName}>`,
  );
}

export function findUnresolvedTemplateTokens(html) {
  const body = stripScriptAndStyleContents(html);
  const found = [];
  for (const { pattern, label } of TEMPLATE_TOKEN_PATTERNS) {
    const match = pattern.exec(body);
    if (match) found.push({ token: match[0], label });
  }
  return found;
}

export function validateNoUnresolvedTemplateTokens(relative, html) {
  return findUnresolvedTemplateTokens(html).map(
    ({ token, label }) =>
      `${relative}: [template-token] unresolved template token (${label}) remains in rendered HTML: ${JSON.stringify(token.slice(0, 80))}`,
  );
}

// 記事ページの商品数を、BaseLayout が出力する
// <meta name="article:product-count" content="N"> から読み取る。
// 商品数の唯一の情報源は記事メタデータ（src/content/articles.ts の productCount）。
// 記事ページなのに meta が無い・値が不正な場合は null を返し、エラーを errors に積む。
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
  if (buyLinks.length !== 2) {
    errors.push(
      `${relative}: next-step block must render exactly 2 purchase buttons (next-step__buy), found ${buyLinks.length}`,
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
function collectArticleCards(html) {
  const cards = [];
  for (const match of html.matchAll(
    /<article\b[^>]*class="[^"]*\barticle-list-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
  )) {
    const card = match[0];
    if (!/\bdata-content-type="(?:guide|comparison)"/.test(card)) continue;
    cards.push(card);
  }
  return cards;
}

export function validateArticleCardThumbnails(relative, html) {
  const errors = [];
  for (const card of collectArticleCards(html)) {
    const thumb = card.match(/\bdata-thumb="([^"]+)"/)?.[1] ?? null;
    const hasImg = /<img\b[^>]*class="[^"]*\bcard-thumb\b[^"]*"/.test(card);
    const tileMatch = card.match(
      /<div\b[^>]*class="[^"]*\bcard-tile\b[^"]*"[^>]*>[\s\S]*?<span\b[^>]*class="[^"]*\bcard-tile-label\b[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/,
    );
    const hasTile = tileMatch !== null;
    const tileLabel = tileMatch?.[1]?.trim() ?? "";

    if (thumb !== "image" && thumb !== "tile") {
      errors.push(
        `${relative}: article card must declare data-thumb="image|tile", found ${JSON.stringify(thumb)}`,
      );
      continue;
    }
    if (thumb === "image" && (!hasImg || hasTile)) {
      errors.push(
        `${relative}: data-thumb="image" card must render exactly one img.card-thumb (img=${hasImg}, tile=${hasTile})`,
      );
    }
    if (thumb === "tile" && (hasImg || !hasTile || tileLabel.length === 0)) {
      errors.push(
        `${relative}: data-thumb="tile" card must render a card-tile with a non-empty label (img=${hasImg}, tile=${hasTile}, label=${JSON.stringify(tileLabel)})`,
      );
    }
  }
  return errors;
}

// トップページのファーストビューには商品検索フォームが必須。
// 送信先は記事一覧の /articles/?q=…（article-discovery.js が URL パラメータを読む）。
export function validateTopSearch(relative, html) {
  if (relative !== "index.html") return [];
  const errors = [];
  const form = html.match(
    /<form\b[^>]*\bdata-top-search\b[^>]*>([\s\S]*?)<\/form>/i,
  );
  if (!form) {
    errors.push(
      "index.html: top page must render a search form with data-top-search",
    );
    return errors;
  }
  if (
    !/<form\b[^>]*\bdata-top-search\b[^>]*action="\/articles\/"/i.test(html)
  ) {
    errors.push(
      'index.html: top search form must submit to action="/articles/"',
    );
  }
  if (!/<input\b[^>]*name="q"/.test(form[1])) {
    errors.push("index.html: top search form must contain an input named q");
  }
  if (!/<button\b[^>]*type="submit"/.test(form[1])) {
    errors.push("index.html: top search form must contain a submit button");
  }
  return errors;
}

// 記事カードには「向き」（選び分け）の1行が必須（audiences 由来）。
// 記事一覧の検索結果カード（article-discovery.js の createCard）も同じ行を
// 描画するため、静的カード側の欠落を fail-closed で検出する。
export function validateArticleCardAudiences(relative, html) {
  const errors = [];
  for (const card of collectArticleCards(html)) {
    const line =
      card.match(
        /<p\b[^>]*class="[^"]*\bcard-audiences\b[^"]*"[^>]*>([\s\S]*?)<\/p>/,
      )?.[1] ?? "";
    if (!line.trim()) {
      errors.push(
        `${relative}: article card must render a card-audiences line with the 向き selection`,
      );
    }
  }
  return errors;
}

// 比較記事カードには「型番行」（card-subjects）が必須。
// comparisonSubjects 由来の A/B 商品名（型番・シリーズ名）を欠落させると、
// 「探す場所」としてのカードが成立しないため fail-closed で検出する。
// 商品ガイド（productCount = 1）はペアを持たないため対象外。
export function validateArticleCardSubjects(relative, html) {
  const errors = [];
  for (const card of collectArticleCards(html)) {
    if (!/\bdata-content-type="comparison"/.test(card)) continue;
    const line =
      card.match(
        /<p\b[^>]*class="[^"]*\bcard-subjects\b[^"]*"[^>]*>([\s\S]*?)<\/p>/,
      )?.[1] ?? "";
    if (!line.trim()) {
      errors.push(
        `${relative}: comparison article card must render a card-subjects line with the A/B model numbers`,
      );
    }
  }
  return errors;
}

// 全ページのヘッダーは「ロゴ + ハンバーガー（details.nav-toggle） + リンク群（nav.navlinks）」
// 構造であることが必須。スマホ（<560px）では details のネイティブ開閉でドロワー表示に
// なるため、この構造が無いページはモバイルメニューを持たない（fail-closed）。
export function validateHeaderNav(relative, html) {
  const errors = [];
  const header = html.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0] ?? "";
  if (!header) {
    errors.push(`${relative}: page must render a header`);
    return errors;
  }
  // details の内側だけを対象に summary / navlinks の有無を判定する
  // （<summary> が details の外に置かれた場合を検出するため）。
  const toggle =
    header.match(
      /<details\b[^>]*class="[^"]*\bnav-toggle\b[^"]*"[^>]*>([\s\S]*?)<\/details>/i,
    )?.[1] ?? null;
  if (toggle === null) {
    errors.push(
      `${relative}: header must render the mobile menu (<details class="nav-toggle">)`,
    );
    return errors;
  }
  if (!/<summary/i.test(toggle)) {
    errors.push(
      `${relative}: nav-toggle must contain a <summary> (hamburger trigger)`,
    );
  }
  if (!/<nav\b[^>]*class="[^"]*\bnavlinks\b[^"]*"[^>]*>/i.test(toggle)) {
    errors.push(
      `${relative}: nav-toggle must contain the nav.navlinks link group`,
    );
  }
  return errors;
}

// 比較表（table.comparison）を描画するページは、スマホの比較カード表示で各セルに
// 商品名ラベル（data-label）を付与するスクリプト（BaseLayout の comparison-card-labels）
// が必ず同梱されている必要がある（fail-closed）。
export function validateComparisonCardLabels(relative, html) {
  const errors = [];
  const tables = [
    ...html.matchAll(
      /<table\b[^>]*class="[^"]*\bcomparison\b[^"]*"[^>]*>[\s\S]*?<\/table>/gi,
    ),
  ];
  if (tables.length === 0) {
    return errors;
  }
  if (!/comparison-card-labels/.test(html)) {
    errors.push(
      `${relative}: pages with a comparison table must include the comparison-card-labels script`,
    );
  }
  // スマホの縦カード表示は静的 HTML の data-label で成立させる（JS はフォールバック）。
  // 全セルに data-label が焼き込まれていることを fail-closed で検証する。
  for (const table of tables) {
    const body = table[0].match(/<tbody>([\s\S]*?)<\/tbody>/i)?.[1] ?? "";
    for (const row of body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row[1].matchAll(/<td\b[^>]*>/gi)];
      for (const cell of cells) {
        if (!/\bdata-label\s*=\s*"/.test(cell[0])) {
          errors.push(
            `${relative}: comparison table cells must carry a data-label (mobile card view needs it)`,
          );
          break;
        }
      }
    }
  }
  return errors;
}

// 「根拠・確認先」列（4列目）を持つ比較表は、スマホでは
export function validateSourceToggle(_relative, _html) {
  // source-toggle was removed in P2-2 (empty <details> with no content).
  // This function is kept for backward compatibility but is now a no-op.
  void _relative;
  void _html;
  return [];
}

// 期待 CTA 枚数は、記事メタデータの商品数（productCount）と
// config/article-layout.mjs（ARTICLE_LAYOUT.ctaSets）から記事ごとに導出する。
// 比較記事（productCount=2）→ 2枚、単一商品記事（productCount=1）→ 1枚（v3）。
// レイアウト変更時は config だけを直し、ここに枚数をハードコードしない。
const AFFILIATE_URL_PATTERN =
  /https:\/\/(?:[^./]+\.)?(?:a\.r10\.to|r10\.to|hb\.afl\.rakuten\.co\.jp)(?:\/|$)/i;

/**
 * 記事ページの購入 CTA を検査する。
 * @param {string} relative dist からの相対パス
 * @param {string} html レンダリング済み HTML
 * @param {number} expectedCount 期待 CTA 総数
 * @param {Record<string, number> | null} [expectedByPlacement] placement 別の期待枚数（指定時は照合）
 */
export function validateArticleCtas(
  relative,
  html,
  expectedCount,
  expectedByPlacement = null,
) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const ctaPattern = new RegExp(
    `<a\\b[^>]*data-cta-event="${ARTICLE_LAYOUT.ctaEvent}"[^>]*>[\\s\\S]*?<\\/a>`,
    "gi",
  );
  const tags = [...html.matchAll(ctaPattern)].map(([tag]) => tag);
  const errors = [];
  if (tags.length !== expectedCount) {
    errors.push(
      `${relative}: expected exactly ${expectedCount} purchase CTAs (per config/article-layout.mjs and article productCount), found ${tags.length}`,
    );
  }
  if (expectedByPlacement) {
    const actual = {};
    for (const tag of tags) {
      const placement = tag.match(/\bdata-placement="([^"]+)"/i)?.[1] ?? null;
      if (placement === null) continue;
      actual[placement] = (actual[placement] ?? 0) + 1;
    }
    for (const [placement, expected] of Object.entries(expectedByPlacement)) {
      if ((actual[placement] ?? 0) !== expected) {
        errors.push(
          `${relative}: expected ${expected} purchase CTAs with placement "${placement}", found ${actual[placement] ?? 0} (per config/article-layout.mjs)`,
        );
      }
    }
  }
  for (const [index, tag] of tags.entries()) {
    const href = tag.match(/\bhref="([^"]+)"/i)?.[1] ?? "";
    const rel = tag.match(/\brel="([^"]+)"/i)?.[1] ?? "";
    const placement = tag.match(/\bdata-placement="([^"]+)"/i)?.[1] ?? "";
    if (!ARTICLE_LAYOUT.placements.includes(placement)) {
      errors.push(
        `${relative}: CTA ${index + 1} has unrecognized placement${
          placement ? `: ${placement}` : ""
        } (allowed: ${ARTICLE_LAYOUT.placements.join(", ")})`,
      );
    }
    if (/placeholder/i.test(href)) {
      errors.push(
        `${relative}: CTA ${index + 1} must not contain a placeholder URL`,
      );
    }
    if (AFFILIATE_URL_PATTERN.test(href)) {
      // アフィリエイトCTA: スポンサー表記・nofollow・広告表示を必須にする。
      if (!/\bsponsored\b/i.test(rel) || !/\bnofollow\b/i.test(rel)) {
        errors.push(
          `${relative}: CTA ${index + 1} is missing sponsored/nofollow rel attributes`,
        );
      }
      if (!/広告/.test(tag)) {
        errors.push(
          `${relative}: CTA ${index + 1} is missing advertising disclosure`,
        );
      }
    } else {
      // アフィリエイトでないCTA（未差し替え時の楽天検索フォールバック等）は
      // 許可済みの楽天ホストだけを許し、nofollow を必須にする。
      let isRakutenFallback = false;
      let isItemDetail = false;
      try {
        const url = new URL(href);
        isItemDetail =
          url.hostname === "item.rakuten.co.jp" &&
          /^\/[^/]+\/[^/]+\/?$/.test(url.pathname);
        isRakutenFallback =
          url.protocol === "https:" &&
          (url.hostname === "search.rakuten.co.jp" ||
            url.hostname.endsWith(".rakuten.co.jp"));
      } catch {
        // The generic validation below reports malformed URLs.
      }
      if (isItemDetail) {
        continue;
      }
      if (isRakutenFallback) {
        errors.push(
          `${relative}: CTA ${index + 1} must not use a Rakuten search URL; only a confirmed item detail destination is allowed`,
        );
      } else {
        errors.push(
          `${relative}: CTA ${index + 1} is not a confirmed Rakuten affiliate URL`,
        );
      }
    }
  }
  return errors;
}

// 記事末尾の「関連する比較記事」のカード件数を数える。
// セクションは RelatedArticles.astro が aria-labelledby="related-heading" で
// 出力するため、その中にある .article-list-card を数える。
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

// トップページ（dist/index.html）の「よく比較される商品」を検証する。
// config の topPage.featuredPaths（3〜4件）がすべてトップにリンクされ、
// リンク数が config と一致することを照合する。
// 件数を絞ることで「人気（編集選定）」と「最近の比較（追加日）」の
// 意味の違う入口として機能させる。
export function validateTopPageFeatured(topHtml) {
  const errors = [];
  const featuredPaths = ARTICLE_LAYOUT.topPage.featuredPaths;
  if (featuredPaths.length < 3 || featuredPaths.length > 4) {
    errors.push(
      `config/article-layout.mjs: topPage.featuredPaths must have 3-4 items, found ${featuredPaths.length}`,
    );
  }
  const section = topHtml.match(
    /<section\b[^>]*data-top-featured[^>]*>([\s\S]*?)<\/section\s*>/i,
  );
  if (!section) {
    errors.push("top page: missing data-top-featured section");
    return errors;
  }
  const hrefs = [...section[1].matchAll(/href="([^"]+)"/g)].map(
    (match) => match[1],
  );
  const expected = new Set(featuredPaths);
  for (const path of featuredPaths) {
    if (!hrefs.includes(path)) {
      errors.push(`top page: featured article not linked: ${path}`);
    }
  }
  const unexpected = hrefs.filter((href) => !expected.has(href));
  if (unexpected.length) {
    errors.push(
      `top page: unexpected link in data-top-featured section: ${unexpected.join(", ")}`,
    );
  }
  return errors;
}

// 見出しの直後に本文（テキスト・要素）が無い「空セクション」を検出する。
// 次のいずれかに該当する見出しを空セクションとみなす。
// - 見出しの直後に別の見出し（h1〜h6）が続く
// - 見出しの直後に構造的な閉じタグ（main / article / section / details / body / html）が続く
// - 見出しの直後に空要素（例: <p></p>）が続く
// - 見出しが文書末尾にある
// FAQ の <summary><h3>…</h3></summary> は見出しの直後に閉じタグが来るが、
// summary 自体が本文を持つため検出対象から除外する。
const STRUCTURAL_CLOSING_TAGS = new Set([
  "main",
  "article",
  "section",
  "details",
  "body",
  "html",
]);

function summaryRanges(html) {
  const ranges = [];
  for (const match of html.matchAll(
    /<summary\b[^>]*>[\s\S]*?<\/summary\s*>/gi,
  )) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function skipWhitespaceAndComments(html, index) {
  let current = index;
  while (current < html.length) {
    const whitespace = /^\s*/.exec(html.slice(current));
    current += whitespace[0].length;
    if (!html.startsWith("<!--", current)) break;
    const commentEnd = html.indexOf("-->", current + 4);
    if (commentEnd === -1) return html.length;
    current = commentEnd + 3;
  }
  return current;
}

function nextMeaningfulToken(html, index) {
  const current = skipWhitespaceAndComments(html, index);
  if (current >= html.length) return { type: "end" };
  if (html[current] !== "<") return { type: "text" };

  const tagMatch = html.slice(current).match(/^<(\/?)\s*([A-Za-z][\w:-]*)/);
  if (!tagMatch) return { type: "text" };

  const closing = tagMatch[1] === "/";
  const tagName = tagMatch[2].toLowerCase();
  if (closing) return { type: "closingTag", name: tagName };
  if (/^h[1-6]$/.test(tagName)) return { type: "heading", name: tagName };

  const tagEnd = findTagEnd(html, current + tagMatch[0].length);
  if (typeof tagEnd === "number") {
    const afterOpen = skipWhitespaceAndComments(html, tagEnd);
    if (new RegExp(`^</${tagName}\\s*>`).test(html.slice(afterOpen))) {
      return { type: "emptyElement", name: tagName };
    }
  }
  return { type: "openingTag", name: tagName };
}

export function findEmptySections(html) {
  const summaries = summaryRanges(html);
  const sections = [];
  const headingPattern = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi;
  for (const match of html.matchAll(headingPattern)) {
    const start = match.index;
    if (summaries.some(([from, to]) => start >= from && start < to)) continue;
    const token = nextMeaningfulToken(html, start + match[0].length);
    const isEmpty =
      token.type === "end" ||
      token.type === "heading" ||
      (token.type === "closingTag" &&
        STRUCTURAL_CLOSING_TAGS.has(token.name)) ||
      token.type === "emptyElement";
    if (isEmpty) {
      sections.push({
        level: Number(match[1]),
        heading: match[2].trim(),
        start,
      });
    }
  }
  return sections;
}

export function validateRenderedHtml({ distDirectory = "dist" } = {}) {
  const htmlFiles = [];
  walk(distDirectory, htmlFiles);
  htmlFiles.sort();
  const errors = [];

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    const mainCount = (html.match(/<main(?:\s|>)/g) ?? []).length;
    const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;

    if (mainCount !== 1)
      errors.push(`${file}: expected one main, found ${mainCount}`);
    if (h1Count !== 1)
      errors.push(`${file}: expected one h1, found ${h1Count}`);
    if (
      !/<meta name="robots" content="(?:index,follow|noindex,nofollow)"/.test(
        html,
      )
    ) {
      errors.push(`${file}: missing robots metadata`);
    }
    if (!/<link rel="canonical" href="https:\/\//.test(html)) {
      errors.push(`${file}: missing HTTPS canonical`);
    }
    if (html.includes("kuraberu-ikuji.pages.dev")) {
      errors.push(`${file}: contains obsolete site URL`);
    }

    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const target = internalTarget(match[1], distDirectory);
      if (target && !fs.existsSync(target)) {
        errors.push(`${file}: broken internal link ${match[1]}`);
      }
    }

    for (const section of findEmptySections(html)) {
      errors.push(
        `${file}: empty section: <h${section.level}>${section.heading}</h${section.level}>`,
      );
    }

    errors.push(...validateArticleCardThumbnails(file, html));
    errors.push(...validateArticleCardAudiences(file, html));
    errors.push(...validateArticleCardSubjects(file, html));
    errors.push(...validateHeaderNav(file, html));
    errors.push(...validateComparisonCardLabels(file, html));
  } // トップページの検索フォーム（index.html のみ。fixture 等で無ければスキップ）。
  const topPagePath = path.join(distDirectory, "index.html");
  if (fs.existsSync(topPagePath)) {
    errors.push(
      ...validateTopSearch(
        path.relative(distDirectory, topPagePath).replace(/\\/g, "/"),
        fs.readFileSync(topPagePath, "utf8"),
      ),
    );
  }

  // Content leakage guard: article-specific copy must never leak into other pages.
  const articleSpecificCopy = [
    // 水筒（サーモス vs タイガー）固有の仕様文言
    {
      phrase: "保温効力68",
      exclude: /articles\/(thermos-tiger-bottle|tiger-mta-j050-guide)\//,
    },
    {
      phrase: "容量0.5L",
      exclude: /articles\/(thermos-tiger-bottle|tiger-mta-j050-guide)\//,
    },
    // 紙おむつ（メリーズ）固有
    {
      phrase: "カシミヤタッチ",
      exclude: /articles\/merries-(newborn|pants)\//,
    },
  ];
  for (const file of htmlFiles) {
    if (!file.endsWith(".html")) continue;
    const relative = path.relative(distDirectory, file).replace(/\\/g, "/");
    const html = fs.readFileSync(file, "utf8");
    for (const { phrase, exclude } of articleSpecificCopy) {
      if (exclude.test(relative)) continue;
      if (html.includes(phrase)) {
        errors.push(
          `${file}: article-specific copy leaked into another page: ${phrase}`,
        );
      }
    }
    if (!ARTICLE_PAGE_PATTERN.test(relative)) continue;
    // 「関連する比較記事」の件数上限（config/article-layout.mjs 由来）
    errors.push(...validateRelatedArticleSection(relative, html));
    // 記事ごとの期待 CTA 枚数は、記事メタデータの productCount
    // （meta タグ経由）と config の ctaSets から導出する。
    const productCount = readArticleProductCount(relative, html, errors);
    if (productCount === null) continue;
    errors.push(...validateArticleContentType(relative, html, productCount));
    errors.push(...validateSourceToggle(relative, html));
    errors.push(...validateArticleTrustLine(relative, html));
    errors.push(...validateArticleNextStep(relative, html));
    errors.push(...validateArticlePurchaseLinkStatus(relative, html));
    errors.push(...validateArticleSectionOrder(relative, html));
    // Issue #343: 全記事ページへ拡大した検証（必須セクション有無・未解決トークン）
    errors.push(...validateRequiredSections(relative, html));
    errors.push(...validateNoUnresolvedTemplateTokens(relative, html));
    errors.push(
      ...validateArticleCtas(
        relative,
        html,
        expectedPurchaseCtasPerArticle(productCount, ARTICLE_LAYOUT),
        expectedPlacementCounts(productCount, ARTICLE_LAYOUT),
      ),
    );
  }

  errors.push(
    ...validateRenderedExternalEmbedCounts(
      htmlFiles.map((filePath) => ({
        filePath,
        html: fs.readFileSync(filePath, "utf8"),
      })),
    ),
  );

  // トップページ（dist/index.html）のカテゴリ入口と「よく比較される商品」。
  // カテゴリの実在性は比較記事一覧（dist/articles/index.html）の option と照合する。
  const topPage = htmlFiles.find(
    (filePath) =>
      path.relative(distDirectory, filePath).replace(/\\/g, "/") ===
      "index.html",
  );
  const articlesIndex = htmlFiles.find(
    (filePath) =>
      path.relative(distDirectory, filePath).replace(/\\/g, "/") ===
      "articles/index.html",
  );
  if (topPage) {
    if (!articlesIndex) {
      errors.push(
        "top page: cannot validate: /articles/ index not found in dist",
      );
    } else {
      const topHtml = fs.readFileSync(topPage, "utf8");
      const articlesIndexHtml = fs.readFileSync(articlesIndex, "utf8");
      errors.push(
        ...validateTopPageCategories(topHtml, articlesIndexHtml),
        ...validateTopPageFeatured(topHtml),
      );
    }
  }

  // 外部埋め込み（X / YouTube / TikTok / Pinterest）はユーザーが同意した後に
  // JSで挿入する設計（docs/external-embed-policy.md）。
  // 初期HTMLにサードパーティの script / iframe / preconnect が混入すると
  // 埋め込みコンテンツが自動ロードされてしまうため、全ページで検証する。
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    const thirdPartyScript = [
      ...html.matchAll(/<script[^>]+\bsrc=["']([^"']+)/gi),
    ].some(([, src]) => /^(?:https?:)?\/\//i.test(src));
    const thirdPartyIframe = /<iframe(?:\s|>)/i.test(html);
    const preconnect = /<link[^>]+rel=["']?preconnect/i.test(html);

    if (thirdPartyScript)
      errors.push(`${file}: third-party script tag in initial HTML`);
    if (thirdPartyIframe) errors.push(`${file}: iframe tag in initial HTML`);
    if (preconnect) errors.push(`${file}: preconnect in initial HTML`);
  }

  return { errors, pageCount: htmlFiles.length };
}

// ---- 許可リスト（docs/rendered-gate-allowlist.md, Issue #343）----
//
// 全ページへゲートを拡大した結果、既存データ由来の違反が見つかった場合、
// ゲートを緩めずに例外だけを docs/rendered-gate-allowlist.md の表で
// 明示する。形式:
//   | path | rule | reason |
//   | `articles/<slug>/index.html` | `required-section:<id>` / `template-token` | 理由 |
const ALLOWLIST_FILE = "docs/rendered-gate-allowlist.md";

/** 許可リスト markdown の表部分をパースする（行ベース・壊れた行は無視）。 */
export function parseRenderedGateAllowlist(markdown) {
  const entries = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/^`|`$/g, ""));
    if (cells.length < 3) continue;
    const [entryPath, rule, reason] = cells;
    if (!entryPath || !rule || entryPath === "path") continue;
    entries.push({ path: entryPath, rule, reason: reason ?? "" });
  }
  return entries;
}

/** エラー行の先頭（dist 相対パス）とルールタグで許可リストを適用する。 */
export function applyRenderedGateAllowlist(errors, entries) {
  if (entries.length === 0) return [...errors];
  const byPath = new Map();
  for (const entry of entries) {
    const rules = byPath.get(entry.path) ?? new Set();
    rules.add(entry.rule);
    byPath.set(entry.path, rules);
  }
  return errors.filter((error) => {
    const separator = error.indexOf(": ");
    if (separator === -1) return true;
    const errorPath = error.slice(0, separator).replace(/\\/g, "/");
    const rules = byPath.get(errorPath);
    if (!rules) return true;
    for (const rule of rules) {
      if (error.includes(`[${rule}]`)) return false;
    }
    return true;
  });
}

function loadRenderedGateAllowlist() {
  // リポジトリルート基準で許可リストを読む
  const candidate = path.join(process.cwd(), ALLOWLIST_FILE);
  return fs.existsSync(candidate)
    ? parseRenderedGateAllowlist(fs.readFileSync(candidate, "utf8"))
    : [];
}

if (
  path.resolve(process.argv[1] ?? "") ===
  path.resolve(fileURLToPath(import.meta.url))
) {
  let { errors, pageCount } = validateRenderedHtml();
  const allowlistEntries = loadRenderedGateAllowlist();
  const before = errors.length;
  errors = applyRenderedGateAllowlist(errors, allowlistEntries);
  if (before !== errors.length) {
    console.log(
      `rendered gate allowlist: ${before - errors.length} documented exception(s) applied from ${ALLOWLIST_FILE}`,
    );
  }
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`rendered html ok: ${pageCount} pages`);
}
