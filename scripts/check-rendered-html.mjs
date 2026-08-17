import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_EXTERNAL_EMBEDS_PER_PAGE } from "./external-embed-limit.mjs";
import {
  ARTICLE_LAYOUT,
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

// 期待 CTA 枚数は、記事メタデータの商品数（productCount）と
// config/article-layout.mjs（ARTICLE_LAYOUT.ctaSets）から記事ごとに導出する。
// 比較記事（productCount=2）→ 4枚、単一商品記事（productCount=1）→ 2枚。
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

// 記事末尾の「関連する比較記事」（同カテゴリ）のカード件数を数える。
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

// 記事ページの「関連する比較記事」件数が config/article-layout.mjs の
// relatedArticlesLimit を超えないことを検証する。
// 件数の唯一の情報源は config（コンポーネントもここから slice する）。
export function validateRelatedArticleSection(relative, html) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const count = countRelatedArticleCards(html);
  const limit = ARTICLE_LAYOUT.relatedArticlesLimit;
  if (count > limit) {
    return [
      `${relative}: related comparison articles exceed the limit: found ${count}, maximum is ${limit} (per config/article-layout.mjs)`,
    ];
  }
  return [];
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
