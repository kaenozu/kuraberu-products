// 生成HTML検査のオーケストレータ（#702 で validators/ に分割）。
//
// 各検査の実装は scripts/validators/*.mjs に置き、ここには全体駆動の
// validateRenderedHtml と CLI エントリだけを残す。
// 後方互換のため、従来の公開名はすべて再公開する（テスト・他ゲートの
// import 先は変更不要）。自作HTMLパーサの置換は別途対応する。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARTICLE_LAYOUT,
  expectedPlacementCounts,
  expectedPurchaseCtasPerArticle,
} from "../config/article-layout.mjs";
import { internalTarget, walk } from "./validators/html-parse.mjs";
import { validateRenderedExternalEmbedCounts } from "./validators/external-embeds.mjs";
import {
  ARTICLE_PAGE_PATTERN,
  validateArticleSectionOrder,
  validateRequiredSections,
} from "./validators/article-sections.mjs";
import {
  validateNoUnresolvedTemplateTokens,
  validateRepeatedJapanesePunctuation,
  validateRepeatedJapaneseWords,
} from "./validators/article-text.mjs";
import {
  readArticleProductCount,
  validateArticleContentType,
  validateArticleNextStep,
  validateArticlePurchaseLinkStatus,
  validateArticleTrustLine,
} from "./validators/article-meta.mjs";
import {
  validateArticleCardAudiences,
  validateArticleCardSubjects,
  validateArticleCardThumbnails,
  validateComparisonCardLabels,
  validateHeaderNav,
  validateSourceToggle,
  validateTopSearch,
} from "./validators/article-cards.mjs";
import { validateArticleCtas } from "./validators/article-ctas.mjs";
import { validateRelatedArticleSection } from "./validators/related.mjs";
import {
  validateTopPageCategories,
  validateTopPageLatest,
} from "./validators/top-page.mjs";
import { findEmptySections } from "./validators/empty-sections.mjs";
import {
  ALLOWLIST_FILE,
  applyRenderedGateAllowlist,
  loadRenderedGateAllowlist,
} from "./validators/allowlist.mjs";

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
    const purchaseLinkStatus =
      html.match(
        /<meta name="article:purchase-link-status" content="([^"]+)">/i,
      )?.[1] ?? null;
    const hasPurchaseCtas =
      purchaseLinkStatus === "verified" || purchaseLinkStatus === "direct";
    const expectedCtaCount = !hasPurchaseCtas
      ? 0
      : expectedPurchaseCtasPerArticle(productCount, ARTICLE_LAYOUT);
    const expectedCtasByPlacement = !hasPurchaseCtas
      ? {}
      : expectedPlacementCounts(productCount, ARTICLE_LAYOUT);
    errors.push(...validateArticleContentType(relative, html, productCount));
    errors.push(...validateSourceToggle(relative, html));
    errors.push(...validateArticleTrustLine(relative, html));
    errors.push(...validateArticleNextStep(relative, html));
    errors.push(...validateArticlePurchaseLinkStatus(relative, html));
    errors.push(...validateArticleSectionOrder(relative, html));
    // Issue #343: 全記事ページへ拡大した検証（必須セクション有無・未解決トークン）
    errors.push(...validateRequiredSections(relative, html));
    errors.push(...validateNoUnresolvedTemplateTokens(relative, html));
    errors.push(...validateRepeatedJapanesePunctuation(relative, html));
    errors.push(...validateRepeatedJapaneseWords(relative, html));
    errors.push(
      ...validateArticleCtas(
        relative,
        html,
        expectedCtaCount,
        expectedCtasByPlacement,
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
        ...validateTopPageLatest(topHtml),
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

export {
  countRenderedExternalEmbeds,
  validateRenderedExternalEmbedCounts,
} from "./validators/external-embeds.mjs";
export {
  detectArticleTemplate,
  validateArticleSectionOrder,
  validateRequiredSections,
} from "./validators/article-sections.mjs";
export {
  findUnresolvedTemplateTokens,
  validateNoUnresolvedTemplateTokens,
  validateRepeatedJapanesePunctuation,
  validateRepeatedJapaneseWords,
} from "./validators/article-text.mjs";
export {
  readArticleContentType,
  readArticleProductCount,
  readArticlePurchaseLinkStatus,
  validateArticleContentType,
  validateArticleNextStep,
  validateArticlePurchaseLinkStatus,
  validateArticleTrustLine,
} from "./validators/article-meta.mjs";
export {
  validateArticleCardAudiences,
  validateArticleCardSubjects,
  validateArticleCardThumbnails,
  validateComparisonCardLabels,
  validateHeaderNav,
  validateSourceToggle,
  validateTopSearch,
} from "./validators/article-cards.mjs";
export { validateArticleCtas } from "./validators/article-ctas.mjs";
export {
  countOtherArticleLinks,
  countRelatedArticleCards,
  validateRelatedArticleSection,
} from "./validators/related.mjs";
export {
  validateTopPageCategories,
  validateTopPageLatest,
} from "./validators/top-page.mjs";
export { findEmptySections } from "./validators/empty-sections.mjs";
export {
  applyRenderedGateAllowlist,
  parseRenderedGateAllowlist,
} from "./validators/allowlist.mjs";

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
