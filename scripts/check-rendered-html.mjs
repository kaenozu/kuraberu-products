import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_EXTERNAL_EMBEDS_PER_PAGE } from "./external-embed-limit.mjs";
import {
  ARTICLE_LAYOUT,
  contentTypeFor,
  expectedPlacementCounts,
  expectedPurchaseCtasPerArticle,
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
      if (character === quote && source[index - 1] !== "\\") quote = null;
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
  const pathname = href.split("#")[0].split("?")[0];
  if (!pathname || !pathname.startsWith("/")) return null;
  if (pathname === "/") return path.join(distDirectory, "index.html");
  if (path.extname(pathname)) return path.join(distDirectory, pathname);
  return path.join(distDirectory, pathname, "index.html");
}

const ARTICLE_PAGE_PATTERN = /^articles\/[^/]+\/index\.html$/;

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

// 長文記事フラグを <meta name="article:mid-cta" content="true"> から読み取る。
// v3: 途中 CTA（after-decision）は midArticleCta な記事だけに許容される。
export function readArticleMidCta(relative, html, errors) {
  const match = html.match(/<meta name="article:mid-cta" content="(\w+)">/i);
  if (!match) return false;
  if (match[1] !== "true" && match[1] !== "false") {
    errors.push(
      `${relative}: invalid article:mid-cta "${match[1]}" (must be true or false)`,
    );
    return false;
  }
  return match[1] === "true";
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

// 比較記事の結論直後には診断誘導CTA（DiagnosisCta.astro）がちょうど1つ必要。
// - 比較記事（article:content-type="comparison"）: 必ず1つ。
//   href は診断ページ（/tools/product-finder/…）を指し、詳細仕様（#specs）より前に置く。
// - 商品ガイド（article:content-type="guide"）: 診断CTAを出さない（hideDiagnosisCta 経由）。
export function validateArticleDiagnosisCta(relative, html) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const errors = [];
  const contentType =
    html.match(
      /<meta name="article:content-type" content="(guide|comparison)">/i,
    )?.[1] ?? null;
  const ctaSections = [
    ...html.matchAll(
      /<section\b[^>]*class="[^"]*\bdiagnosis-cta\b[^"]*"[^>]*>/gi,
    ),
  ];

  if (contentType === "guide") {
    if (ctaSections.length > 0) {
      errors.push(
        `${relative}: guide article must not render a diagnosis CTA, found ${ctaSections.length}`,
      );
    }
    return errors;
  }

  if (ctaSections.length !== 1) {
    errors.push(
      `${relative}: comparison article must render exactly one diagnosis CTA (diagnosis-cta), found ${ctaSections.length}`,
    );
    return errors;
  }

  const section =
    html.match(
      /<section\b[^>]*class="[^"]*\bdiagnosis-cta\b[^"]*"[^>]*>[\s\S]*?<\/section>/i,
    )?.[0] ?? "";
  const href =
    section.match(
      /<a\b[^>]*class="[^"]*\bdiagnosis-cta__button\b[^"]*"[^>]*href="([^"]+)"/i,
    )?.[1] ?? null;
  if (!href || !href.startsWith("/tools/product-finder/")) {
    errors.push(
      `${relative}: diagnosis CTA must link to /tools/product-finder/…, found ${JSON.stringify(href)}`,
    );
  }

  const specsIndex = html.indexOf('id="specs"');
  const ctaIndex = html.indexOf('class="diagnosis-cta"');
  if (specsIndex !== -1 && (ctaIndex === -1 || ctaIndex > specsIndex)) {
    errors.push(
      `${relative}: diagnosis CTA must appear right after the conclusion (before #specs)`,
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

// 「根拠・確認先」列（4列目）を持つ比較表は、スマホでは
// <details class="source-toggle"> で折りたたむ（CSS-only、docs/article-layout-v3-2026-08.md）。
// 根拠列テーブルを描画する記事にはトグルが必須、逆にトグルのみ存在して
// 根拠列テーブルが無い記事は壊れたトグルとして検出する（fail-closed）。
const SOURCE_COLUMN_HEADER_PATTERN = /^(?:根拠|根拠・確認先)$/;

function isSourceColumnTable(block) {
  const thead = block.match(/<thead>[\s\S]*?<\/thead>/)?.[0] ?? "";
  const headers = [...thead.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) =>
    m[1].trim(),
  );
  if (headers.length !== 4) return false;
  return SOURCE_COLUMN_HEADER_PATTERN.test(headers[3] ?? "");
}

export function validateSourceToggle(relative, html) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const errors = [];
  const tableScrolls = [...html.matchAll(/<div class="table-scroll">/g)];
  let hasSourceTable = false;

  for (let index = 0; index < tableScrolls.length; index += 1) {
    const divStart = tableScrolls[index].index;
    const divEnd =
      index + 1 < tableScrolls.length
        ? tableScrolls[index + 1].index
        : html.length;
    const block = html.slice(divStart, divEnd);
    if (!isSourceColumnTable(block)) continue;
    hasSourceTable = true;

    // 直前の要素（空白を挟んでもよい）が </details> であること
    let cursor = divStart - 1;
    while (cursor >= 0 && /\s/.test(html[cursor])) cursor -= 1;
    const tail = html.slice(Math.max(0, cursor - 9), cursor + 1);
    if (!tail.endsWith("</details>")) {
      errors.push(
        `${relative}: 根拠・確認先 column table must be preceded by <details class="source-toggle">`,
      );
    }
  }

  if (!hasSourceTable && /<details class="source-toggle">/.test(html)) {
    errors.push(
      `${relative}: source-toggle present but no 根拠・確認先 column table found`,
    );
  }
  return errors;
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
      try {
        const url = new URL(href);
        isRakutenFallback =
          url.protocol === "https:" &&
          (url.hostname === "search.rakuten.co.jp" ||
            url.hostname.endsWith(".rakuten.co.jp"));
      } catch {
        // The generic validation below reports malformed URLs.
      }
      if (!isRakutenFallback) {
        errors.push(
          `${relative}: CTA ${index + 1} is not a Rakuten affiliate URL`,
        );
      } else if (!/\bnofollow\b/i.test(rel)) {
        errors.push(
          `${relative}: CTA ${index + 1} fallback URL is missing nofollow rel attribute`,
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
// config の topPage.featuredPaths（3〜6件）がすべてトップにリンクされ、
// リンク数が config と一致することを照合する。
export function validateTopPageFeatured(topHtml) {
  const errors = [];
  const featuredPaths = ARTICLE_LAYOUT.topPage.featuredPaths;
  if (featuredPaths.length < 3 || featuredPaths.length > 6) {
    errors.push(
      `config/article-layout.mjs: topPage.featuredPaths must have 3-6 items, found ${featuredPaths.length}`,
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
    // 記事ごとの期待 CTA 枚数は、記事メタデータの productCount / midArticleCta
    // （meta タグ経由）と config の ctaSets / midArticleSet から導出する。
    const productCount = readArticleProductCount(relative, html, errors);
    if (productCount === null) continue;
    errors.push(...validateArticleContentType(relative, html, productCount));
    errors.push(...validateSourceToggle(relative, html));
    errors.push(...validateArticleTrustLine(relative, html));
    errors.push(...validateArticleDiagnosisCta(relative, html));
    const midArticleCta = readArticleMidCta(relative, html, errors);
    errors.push(
      ...validateArticleCtas(
        relative,
        html,
        expectedPurchaseCtasPerArticle(productCount, ARTICLE_LAYOUT, {
          midArticleCta,
        }),
        expectedPlacementCounts(productCount, ARTICLE_LAYOUT, {
          midArticleCta,
        }),
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

if (
  path.resolve(process.argv[1] ?? "") ===
  path.resolve(fileURLToPath(import.meta.url))
) {
  const { errors, pageCount } = validateRenderedHtml();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`rendered html ok: ${pageCount} pages`);
}
