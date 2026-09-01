import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  countOtherArticleLinks,
  countRelatedArticleCards,
  countRenderedExternalEmbeds,
  findEmptySections,
  readArticleContentType,
  readArticleProductCount,
  validateArticleCtas,
  validateArticleContentType,
  validateArticleCardAudiences,
  validateArticleCardSubjects,
  validateArticleCardThumbnails,
  validateArticleTrustLine,
  validateArticleNextStep,
  validateArticlePurchaseLinkStatus,
  validateArticleSectionOrder,
  validateTopSearch,
  validateHeaderNav,
  validateComparisonCardLabels,
  validateSourceToggle,
  validateRelatedArticleSection,
  validateRenderedExternalEmbedCounts,
  validateRenderedHtml,
  validateRepeatedJapanesePunctuation,
  validateTopPageCategories,
  validateTopPageFeatured,
} from "../scripts/check-rendered-html.mjs";
import {
  ARTICLE_LAYOUT,
  expectedPlacementCounts,
  expectedPurchaseCtasPerArticle,
} from "../config/article-layout.mjs";

const fixtureDirectories: string[] = [];

const embed = '<div data-external-embed="x"></div>';

const validCta = (href: string, placement = "article-end") =>
  `<a href="${href}" rel="sponsored nofollow noopener noreferrer" data-cta-event="purchase" data-placement="${placement}">商品を確認（広告）</a>`;

// 通常の 2 商品記事: 末尾のみ 1×2 = 2 枚
const twoEndCtas = `${validCta("https://a.r10.to/one")}${validCta(
  "https://a.r10.to/two",
)}`;

// 通常の 2 商品記事の CTA 一式: 末尾 2 枚 + 結論直後（next-step）2 枚 = 4 枚
const fourCtas =
  `${validCta("https://a.r10.to/one", "article-end")}${validCta(
    "https://a.r10.to/two",
    "article-end",
  )}` +
  `${validCta("https://a.r10.to/three", "next-step")}${validCta(
    "https://a.r10.to/four",
    "next-step",
  )}`;

// 結論直後の「次にすること」ブロック（NextStepBlock 相当）の fixture。
// 購入ボタン2つ（next-step__buy）と診断リンク（next-step__diagnosis-link）を1つの
// section.next-step[data-next-step] に持つ。
const nextStepBlockFixture = (diagnosisHref = "/tools/product-finder/") =>
  `<section class="next-step" data-next-step aria-label="次にすること"><div class="next-step__grid"><a class="next-step__buy next-step__buy--left" href="https://a.r10.to/one" rel="sponsored nofollow noopener noreferrer" data-cta-event="purchase" data-placement="next-step">Aを見る（広告）</a><a class="next-step__buy next-step__buy--right" href="https://a.r10.to/two" rel="sponsored nofollow noopener noreferrer" data-cta-event="purchase" data-placement="next-step">Bを見る（広告）</a></div><p class="next-step__diagnosis">まだ迷っている？<a class="next-step__diagnosis-link" href="${diagnosisHref}">30秒で診断する →</a></p></section>`;

// 通常の単一商品記事: 末尾 1 枚
const oneEndCta = validCta("https://a.r10.to/one");

function validPage(body: string) {
  // BaseLayout 相当のヘッダー（ロゴ + details.nav-toggle + nav.navlinks）と
  // comparison-card-labels マーカー（head の meta。コメントだと注入本文の
  // 未終了コメント検知を壊すため meta で持つ）を含める
  // （validateHeaderNav / validateComparisonCardLabels ゲートが要求するため）。
  // ヘッダーリンクはアンカー（#）にして broken-internal-link 検知を避ける。
  return `<!doctype html>
<html><head><meta name="robots" content="index,follow"><link rel="canonical" href="https://example.invalid/"><meta name="comparison-card-labels" content="present"><meta name="article:purchase-link-status" content="verified"></head>
<body><header><div class="wrap nav"><a class="brand" href="#">Fixture</a><details class="nav-toggle"><summary></summary><nav class="navlinks"><a href="#menu">比較記事</a></nav></details></div></header><p class="meta">カテゴリ・2026-01-01</p><main><h1>Fixture</h1>${body}</main></body></html>`;
}

function sectionsOf(html: string) {
  return findEmptySections(html).map(({ level, heading }) => ({
    level,
    heading,
  }));
}

describe("rendered article CTA audit", () => {
  it("allows purchase CTAs for any article regardless of purchase-link-status", () => {
    expect(
      validateArticlePurchaseLinkStatus(
        "articles/example/index.html",
        '<a data-cta-event="purchase" href="https://a.r10.to/example">購入</a>',
      ),
    ).toEqual([]);
    expect(
      validateArticlePurchaseLinkStatus(
        "articles/example/index.html",
        '<meta name="article:purchase-link-status" content="unavailable"><a data-cta-event="purchase" href="https://a.r10.to/example">購入</a>',
      ),
    ).toEqual([]);
  });

  it("accepts four CTAs for a two-product article (article-end + next-step)", () => {
    const standardComparisonCtas =
      twoEndCtas +
      `${validCta("https://a.r10.to/three", "next-step")}${validCta(
        "https://a.r10.to/four",
        "next-step",
      )}`;
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        standardComparisonCtas,
        expectedPurchaseCtasPerArticle(2),
      ),
    ).toEqual([]);
  });

  it("accepts one article-end CTA for a single-product article", () => {
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        oneEndCta,
        expectedPurchaseCtasPerArticle(1),
      ),
    ).toEqual([]);
  });

  it("rejects a single-product article with too many CTAs", () => {
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        fourCtas,
        expectedPurchaseCtasPerArticle(1),
      ),
    ).toEqual([
      "articles/example/index.html: expected exactly 1 purchase CTAs (per config/article-layout.mjs and article productCount), found 4",
    ]);
  });

  it("rejects missing CTA count, disallowed host, and missing nofollow", () => {
    const html =
      '<a href="https://example.com" data-cta-event="purchase" data-placement="article-end">購入</a>';
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        html,
        expectedPurchaseCtasPerArticle(2),
      ),
    ).toEqual([
      "articles/example/index.html: expected exactly 4 purchase CTAs (per config/article-layout.mjs and article productCount), found 1",
      "articles/example/index.html: CTA 1 is not a confirmed Rakuten affiliate URL",
    ]);
  });

  it("rejects a plain Rakuten search fallback CTA", () => {
    const searchCta =
      '<a href="https://search.rakuten.co.jp/search/mall/KX-HC705" rel="nofollow noopener noreferrer" data-cta-event="purchase" data-placement="article-end">楽天市場で検索</a>';
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        searchCta,
        expectedPurchaseCtasPerArticle(1),
      ),
    ).toEqual([
      "articles/example/index.html: CTA 1 must not use a Rakuten search URL; only a confirmed item detail destination is allowed",
    ]);
  });

  it("rejects a placeholder affiliate URL", () => {
    const placeholderCta =
      '<a href="https://a.r10.to/placeholder-kx-hc705" rel="sponsored nofollow noopener noreferrer" data-cta-event="purchase" data-placement="article-end">商品を確認（広告）</a>';
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        placeholderCta,
        expectedPurchaseCtasPerArticle(1),
      ),
    ).toEqual([
      "articles/example/index.html: CTA 1 must not contain a placeholder URL",
    ]);
  });

  it("rejects a CTA whose placement is not allowed by the layout config", () => {
    const html =
      `${validCta("https://a.r10.to/one", "article-end")}` +
      `<a href="https://a.r10.to/three" rel="sponsored nofollow noopener noreferrer" data-cta-event="purchase" data-placement="bogus">商品を確認（広告）</a>` +
      `${validCta("https://a.r10.to/four", "next-step")}${validCta(
        "https://a.r10.to/five",
        "next-step",
      )}`;
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        html,
        expectedPurchaseCtasPerArticle(2),
      ),
    ).toEqual([
      "articles/example/index.html: CTA 2 has unrecognized placement: bogus (allowed: article-end, next-step)",
    ]);
  });

  it("rejects a mismatched per-placement CTA layout via expectedPlacementCounts", () => {
    // 総数は合わない（2 枚 vs 期待 4 枚）上に、next-step が無い混在パターン
    const mixed = `${validCta("https://a.r10.to/one")}${validCta(
      "https://a.r10.to/two",
    )}`;
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        mixed,
        expectedPurchaseCtasPerArticle(2),
        expectedPlacementCounts(2),
      ),
    ).toEqual([
      "articles/example/index.html: expected exactly 4 purchase CTAs (per config/article-layout.mjs and article productCount), found 2",
      'articles/example/index.html: expected 2 purchase CTAs with placement "next-step", found 0 (per config/article-layout.mjs)',
    ]);
  });

  it("ignores non-article pages regardless of expected count", () => {
    expect(
      validateArticleCtas(
        "about/index.html",
        fourCtas,
        expectedPurchaseCtasPerArticle(2),
      ),
    ).toEqual([]);
  });
});

describe("related comparison article limit", () => {
  const card = (path: string) =>
    `<article class="card article-list-card"><h3><a href="${path}">見出し</a></h3><p>概要</p></article>`;
  const link = (path: string) => `<li><a href="${path}">見出し</a></li>`;
  const relatedSection = (cards: string) =>
    `<section class="related-articles section wrap" aria-labelledby="related-heading"><h2 id="related-heading">関連する比較記事</h2><div class="article-list">${cards}</div></section>`;
  const othersSection = (links: string) =>
    `<section class="related-articles section wrap" aria-labelledby="others-heading"><h2 id="others-heading">ほかの比較記事</h2><ul class="related-links">${links}</ul></section>`;

  it("uses the layout config as the source of truth", () => {
    expect(ARTICLE_LAYOUT.relatedSelection.limit).toBeGreaterThanOrEqual(3);
    expect(ARTICLE_LAYOUT.relatedSelection.limit).toBeLessThanOrEqual(4);
    expect(ARTICLE_LAYOUT.relatedSelection.othersLimit).toBeGreaterThanOrEqual(
      2,
    );
    expect(ARTICLE_LAYOUT.relatedSelection.othersLimit).toBeLessThanOrEqual(4);
  });

  it("counts only cards inside the related section", () => {
    const html =
      othersSection(link("/a/")) + relatedSection(card("/b/") + card("/c/"));
    expect(countRelatedArticleCards(html)).toBe(2);
    expect(countOtherArticleLinks(html)).toBe(1);
  });

  it("returns zero when no section is rendered", () => {
    expect(countRelatedArticleCards(validPage(""))).toBe(0);
    expect(countOtherArticleLinks(validPage(""))).toBe(0);
  });

  it("accepts up to the configured limits on an article page", () => {
    const html = validPage(
      relatedSection(
        card("/a/").repeat(ARTICLE_LAYOUT.relatedSelection.limit),
      ) +
        othersSection(
          link("/b/").repeat(ARTICLE_LAYOUT.relatedSelection.othersLimit),
        ),
    );
    expect(
      validateRelatedArticleSection("articles/example/index.html", html),
    ).toEqual([]);
  });

  it("rejects more than the configured limit on an article page", () => {
    const html = validPage(
      relatedSection(
        card("/a/").repeat(ARTICLE_LAYOUT.relatedSelection.limit + 1),
      ),
    );
    expect(
      validateRelatedArticleSection("articles/example/index.html", html),
    ).toEqual([
      `articles/example/index.html: related comparison articles exceed the limit: found ${
        ARTICLE_LAYOUT.relatedSelection.limit + 1
      }, maximum is ${ARTICLE_LAYOUT.relatedSelection.limit} (per config/article-layout.mjs)`,
    ]);
  });

  it("rejects more than the others limit on an article page", () => {
    const html = validPage(
      othersSection(
        link("/b/").repeat(ARTICLE_LAYOUT.relatedSelection.othersLimit + 1),
      ),
    );
    expect(
      validateRelatedArticleSection("articles/example/index.html", html),
    ).toEqual([
      `articles/example/index.html: other comparison articles exceed the limit: found ${
        ARTICLE_LAYOUT.relatedSelection.othersLimit + 1
      }, maximum is ${ARTICLE_LAYOUT.relatedSelection.othersLimit} (per config/article-layout.mjs)`,
    ]);
  });

  it("ignores non-article pages", () => {
    const html = validPage(relatedSection(card("/a/").repeat(10)));
    expect(validateRelatedArticleSection("about/index.html", html)).toEqual([]);
  });
});

describe("article product count meta", () => {
  it("reads the product count from the rendered meta tag", () => {
    const errors: string[] = [];
    const html = '<meta name="article:product-count" content="2">';
    expect(
      readArticleProductCount("articles/example/index.html", html, errors),
    ).toBe(2);
    expect(errors).toEqual([]);
  });

  it("reports a missing meta tag on an article page", () => {
    const errors: string[] = [];
    expect(
      readArticleProductCount(
        "articles/example/index.html",
        "<html></html>",
        errors,
      ),
    ).toBeNull();
    expect(errors).toEqual([
      "articles/example/index.html: missing article:product-count meta (productCount in src/content/articles.ts is not rendered)",
    ]);
  });

  it("rejects an invalid meta value", () => {
    const errors: string[] = [];
    const html = '<meta name="article:product-count" content="0">';
    expect(
      readArticleProductCount("articles/example/index.html", html, errors),
    ).toBeNull();
    expect(errors).toEqual([
      'articles/example/index.html: invalid article:product-count "0" (must be a positive integer)',
    ]);
  });

  it("derives the per-article expected count from the meta tags through validateRenderedHtml", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-ctas-"));
    fixtureDirectories.push(directory);
    const articlesDir = path.join(directory, "articles", "example");
    mkdirSync(articlesDir, { recursive: true });
    writeFileSync(
      path.join(articlesDir, "index.html"),
      validPage(
        `<meta name="article:product-count" content="1"><meta name="article:content-type" content="guide"><p class="trust-line">広告を含みます</p>${oneEndCta}`,
      ),
    );

    expect(validateRenderedHtml({ distDirectory: directory }).errors).toEqual(
      [],
    );
  });

  it("derives four CTAs for a comparison article through validateRenderedHtml", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-ctas-"));
    fixtureDirectories.push(directory);
    const articlesDir = path.join(directory, "articles", "long");
    mkdirSync(articlesDir, { recursive: true });
    // 診断CTAの遷移先（/tools/product-finder/）が実在することを満たす
    const diagnosisDir = path.join(directory, "tools", "product-finder");
    mkdirSync(diagnosisDir, { recursive: true });
    writeFileSync(
      path.join(diagnosisDir, "index.html"),
      validPage("<p>テスト用スタブ</p>"),
    );
    writeFileSync(
      path.join(articlesDir, "index.html"),
      validPage(
        `<meta name="article:product-count" content="2"><meta name="article:content-type" content="comparison"><p class="trust-line">広告を含みます</p>${nextStepBlockFixture()}<h2 id="faq">FAQ</h2><div class="purchase-cards">${twoEndCtas}</div><ol class="change-log"><li>更新</li></ol>`,
      ),
    );

    expect(validateRenderedHtml({ distDirectory: directory }).errors).toEqual(
      [],
    );
  });
});

afterEach(() => {
  while (fixtureDirectories.length) {
    rmSync(fixtureDirectories.pop()!, { recursive: true, force: true });
  }
});

describe("rendered external embed limit", () => {
  it("allows zero, three, and four rendered embeds", () => {
    expect(countRenderedExternalEmbeds(validPage(""))).toBe(0);
    expect(countRenderedExternalEmbeds(validPage(embed.repeat(3)))).toBe(3);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/three/index.html", html: validPage(embed.repeat(3)) },
      ]),
    ).toEqual([]);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/four/index.html", html: validPage(embed.repeat(4)) },
      ]),
    ).toEqual([]);
  });

  it.each([
    ["direct ExternalEmbed output", embed.repeat(5)],
    ["wrapper output", `<article>${embed.repeat(5)}</article>`],
    [
      "barrel re-export wrapper output",
      `<section>${embed.repeat(5)}</section>`,
    ],
    [
      "array or loop expansion output",
      `<ul>${[1, 2, 3, 4, 5].map(() => embed).join("")}</ul>`,
    ],
  ])(`rejects five rendered embeds from %s`, (_label, body) => {
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/articles/five/index.html", html: validPage(body) },
      ]),
    ).toEqual([
      "dist/articles/five/index.html: rendered external embed limit exceeded: found 5, maximum is 4",
    ]);
  });

  it("counts each generated HTML page independently", () => {
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/ok/index.html", html: validPage(embed.repeat(4)) },
        { filePath: "dist/bad/index.html", html: validPage(embed.repeat(5)) },
      ]),
    ).toEqual([
      "dist/bad/index.html: rendered external embed limit exceeded: found 5, maximum is 4",
    ]);
  });

  it("ignores comments, attribute values, and module script strings", () => {
    const html = validPage(`
      <!-- ${embed.repeat(4)} -->
      <div data-note="${embed}"></div>
      <script type="module">const html = ${JSON.stringify(embed.repeat(4))};</script>
      ${embed.repeat(3)}
    `);
    expect(countRenderedExternalEmbeds(html)).toBe(3);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/strings/index.html", html },
      ]),
    ).toEqual([]);
  });

  it("does not count embeds inside a terminated multiline comment", () => {
    const html = `<!--
${embed.repeat(4)}
-->
${embed}`;
    expect(countRenderedExternalEmbeds(html)).toBe(1);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/comment-ok/index.html", html },
      ]),
    ).toEqual([]);
  });

  it("rejects an unterminated comment that hides four embeds", () => {
    const html = `<!--
${embed.repeat(4)}`;
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/comment-hidden/index.html", html },
      ]),
    ).toEqual([
      "dist/comment-hidden/index.html: malformed rendered HTML while checking external embeds: unterminated HTML comment",
    ]);
  });

  it.each([
    "<!-- unterminated comment",
    "<div data-external-embed",
    '<div data-external-embed="',
    "<div foo='unterminated",
    "<script>unterminated",
    "<!--",
  ])(`rejects malformed HTML in finite time: %s`, (html) => {
    const startedAt = performance.now();
    expect(countRenderedExternalEmbeds(html)).toBeLessThanOrEqual(1);
    expect(performance.now() - startedAt).toBeLessThan(100);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/malformed/index.html", html },
      ]),
    ).toEqual([
      `dist/malformed/index.html: malformed rendered HTML while checking external embeds${
        html.startsWith("<!--") ? ": unterminated HTML comment" : ""
      }`,
    ]);
  });

  it("cannot bypass the four-embed limit with an unterminated comment", () => {
    const html = validPage(`<!-- ${embed.repeat(4)}`);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "fixtures/unterminated-four.html", html },
      ]),
    ).toEqual([
      "fixtures/unterminated-four.html: malformed rendered HTML while checking external embeds: unterminated HTML comment",
    ]);
  });

  it("counts five normal embeds so the limit check can reject them", () => {
    expect(countRenderedExternalEmbeds(validPage(embed.repeat(5)))).toBe(5);
  });

  it("counts one normal embed", () => {
    expect(countRenderedExternalEmbeds(validPage(embed))).toBe(1);
  });

  it("checks all HTML files under dist and reports the generated path", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-rendered-"));
    fixtureDirectories.push(directory);
    writeFileSync(path.join(directory, "ok.html"), validPage(embed.repeat(4)));
    writeFileSync(path.join(directory, "bad.html"), validPage(embed.repeat(5)));

    expect(validateRenderedHtml({ distDirectory: directory }).errors).toContain(
      `${path.join(directory, "bad.html")}: rendered external embed limit exceeded: found 5, maximum is 4`,
    );
  });
});

describe("rendered empty sections", () => {
  it("flags a heading directly followed by another heading", () => {
    const html =
      "<main><h1>見出し</h1><p>リード</p><h2>購入時の注意</h2>\n\n<h2>更新履歴</h2><p>内容</p></main>";
    expect(sectionsOf(html)).toEqual([{ level: 2, heading: "購入時の注意" }]);
  });

  it("ignores whitespace and comments between the heading and the next heading", () => {
    const html =
      "<main><h1>見出し</h1><p>リード</p><h2>空セクション</h2><!-- コメント -->\n<h3>次の見出し</h3><p>内容</p></main>";
    expect(sectionsOf(html)).toEqual([{ level: 2, heading: "空セクション" }]);
  });

  it("does not flag a heading followed by text content", () => {
    const html =
      "<main><h1>見出し</h1><p>リード</p><h2>本文あり</h2><p>ここに本文がある。</p></main>";
    expect(sectionsOf(html)).toEqual([]);
  });

  it("does not flag a heading followed by a non-empty element", () => {
    const html =
      '<main><h1>見出し</h1><p>リード</p><h2>本文あり</h2><div class="content">本文</div></main>';
    expect(sectionsOf(html)).toEqual([]);
  });

  it("does not flag a heading inside a summary (FAQ pattern)", () => {
    const html =
      '<main><h1>見出し</h1><p>リード</p><details class="faq-item"><summary><h3>質問</h3></summary><p>回答</p></details></main>';
    expect(sectionsOf(html)).toEqual([]);
  });

  it("flags a heading followed by a structural closing tag", () => {
    const html =
      "<main><h1>見出し</h1><p>リード</p><h2>空セクション</h2></main>";
    expect(sectionsOf(html)).toEqual([{ level: 2, heading: "空セクション" }]);
  });

  it("does not flag a heading that ends a non-structural wrapper", () => {
    const html =
      '<main><h1>見出し</h1><p>リード</p><div class="subsection-heading"><h2>題目</h2></div><p>内容</p></main>';
    expect(sectionsOf(html)).toEqual([]);
  });

  it("flags a heading followed by an empty element", () => {
    const html =
      "<main><h1>見出し</h1><p>リード</p><h2>空セクション</h2><p></p></main>";
    expect(sectionsOf(html)).toEqual([{ level: 2, heading: "空セクション" }]);
  });

  it("flags a heading at the end of the document", () => {
    const html = "<main><h1>見出し</h1><p>リード</p><h2>空セクション</h2>";
    expect(sectionsOf(html)).toEqual([{ level: 2, heading: "空セクション" }]);
  });

  it("reports empty sections through validateRenderedHtml with the generated path", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-empty-"));
    fixtureDirectories.push(directory);
    writeFileSync(
      path.join(directory, "index.html"),
      validPage(
        "<p>リード</p><h2>購入時の注意</h2><h2>更新履歴</h2><p>内容</p>",
      ),
    );

    expect(validateRenderedHtml({ distDirectory: directory }).errors).toContain(
      `${path.join(directory, "index.html")}: empty section: <h2>購入時の注意</h2>`,
    );
  });
});

describe("top page featured section", () => {
  const featured = (paths: readonly string[]) =>
    `<section data-top-featured><div class="article-list">${paths
      .map(
        (path) =>
          `<article class="card article-list-card"><div class="card-body"><h2><a href="${path}">見出し</a></h2></div></article>`,
      )
      .join("")}</div></section>`;

  it("accepts the top page when every config path is linked and nothing else", () => {
    expect(
      validateTopPageFeatured(featured(ARTICLE_LAYOUT.topPage.featuredPaths)),
    ).toEqual([]);
  });

  it("reports a missing featured section", () => {
    expect(validateTopPageFeatured("<main></main>")).toEqual([
      "top page: missing data-top-featured section",
    ]);
  });

  it("reports a config path that is not linked", () => {
    const paths = [...ARTICLE_LAYOUT.topPage.featuredPaths];
    paths.pop();
    expect(validateTopPageFeatured(featured(paths))).toEqual([
      `top page: featured article not linked: ${ARTICLE_LAYOUT.topPage.featuredPaths.at(-1)}`,
    ]);
  });

  it("reports an unexpected link inside the featured section", () => {
    expect(
      validateTopPageFeatured(
        featured([
          ...ARTICLE_LAYOUT.topPage.featuredPaths,
          "/articles/unexpected/",
        ]),
      ),
    ).toContain(
      "top page: unexpected link in data-top-featured section: /articles/unexpected/",
    );
  });

  it("enforces the 3-4 item range in config", () => {
    expect(ARTICLE_LAYOUT.topPage.featuredPaths.length).toBeGreaterThanOrEqual(
      3,
    );
    expect(ARTICLE_LAYOUT.topPage.featuredPaths.length).toBeLessThanOrEqual(4);
  });
});

describe("top page category entries", () => {
  const categories = (names: string[]) =>
    `<section data-top-categories><ul class="category-list">${names
      .map(
        (name) =>
          `<li><a class="card-link" href="/articles/?category=${encodeURIComponent(name)}">${name}</a></li>`,
      )
      .join("")}</ul></section>`;
  const articlesIndex = (names: string[]) =>
    `<select name="category">${names
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("")}</select>`;

  it("accepts category entries that exist in the articles index", () => {
    expect(
      validateTopPageCategories(
        categories(["育児用品", "生活家電"]),
        articlesIndex(["育児用品", "生活家電", "キッチン家電"]),
      ),
    ).toEqual([]);
  });

  it("reports a category entry that does not exist in the articles index", () => {
    expect(
      validateTopPageCategories(
        categories(["育児用品", "存在しないカテゴリ"]),
        articlesIndex(["育児用品"]),
      ),
    ).toEqual([
      "top page: category entry points to an unknown category: 存在しないカテゴリ",
    ]);
  });

  it("reports when the articles index has no category options", () => {
    expect(
      validateTopPageCategories(categories(["育児用品"]), "<main/>"),
    ).toEqual([
      "top page: cannot validate categories: no category options found in /articles/",
    ]);
  });

  it("decodes percent-encoded category values before comparing", () => {
    const html = categories(["キッチン・ごみ箱収納"]);
    expect(
      validateTopPageCategories(html, articlesIndex(["キッチン・ごみ箱収納"])),
    ).toEqual([]);
  });
});

describe("article content type", () => {
  const guidePage = (withComparison = false) =>
    `<main>${
      withComparison
        ? '<section class="article-comparison-v2" aria-label="商品の比較"></section>'
        : ""
    }</main>`;
  const validPageWithMeta = (body: string, contentType: string) =>
    `<meta name="article:product-count" content="1"><meta name="article:content-type" content="${contentType}">${body}`;

  it("reads the content type meta", () => {
    const errors: string[] = [];
    expect(
      readArticleContentType(
        "articles/guide/index.html",
        validPageWithMeta(guidePage(), "guide"),
        errors,
      ),
    ).toBe("guide");
    expect(errors).toEqual([]);
  });

  it("reports a missing content type meta", () => {
    const errors: string[] = [];
    expect(
      readArticleContentType(
        "articles/guide/index.html",
        "<main></main>",
        errors,
      ),
    ).toBeNull();
    expect(errors).toEqual([
      "articles/guide/index.html: missing article:content-type meta",
    ]);
  });

  it("accepts a guide with productCount 1 and no comparison section", () => {
    expect(
      validateArticleContentType(
        "articles/guide/index.html",
        validPageWithMeta(guidePage(), "guide"),
        1,
      ),
    ).toEqual([]);
  });

  it("rejects a comparison section inside a guide", () => {
    expect(
      validateArticleContentType(
        "articles/guide/index.html",
        validPageWithMeta(guidePage(true), "guide"),
        1,
      ),
    ).toEqual([
      "articles/guide/index.html: guide article renders a comparison section (article-comparison-v2)",
    ]);
  });

  it("reports a content type that contradicts the product count", () => {
    expect(
      validateArticleContentType(
        "articles/guide/index.html",
        validPageWithMeta(guidePage(), "comparison"),
        1,
      ),
    ).toEqual([
      'articles/guide/index.html: article:content-type is "comparison" but productCount 1 expects "guide" (per config/article-layout.mjs)',
    ]);
  });

  it("rejects a non-article page path", () => {
    expect(
      validateArticleContentType(
        "index.html",
        validPageWithMeta(guidePage(), "guide"),
        1,
      ),
    ).toEqual([]);
  });
});

describe("source-toggle fold (根拠・確認先 column)", () => {
  const sourceTable = (toggle: boolean) =>
    `<details class="fold-section" id="specs"><summary>詳細仕様</summary>${toggle ? '<details class="source-toggle"><summary>根拠・確認先を表示</summary></details>' : ""}<div class="table-scroll"><table class="comparison"><thead><tr><th scope="col">比較項目</th><th scope="col">A</th><th scope="col">B</th><th scope="col">根拠・確認先</th></tr></thead><tbody><tr><th scope="row">重量</th><td>1kg</td><td>2kg</td><td>公式ページ</td></tr></tbody></table></div></details>`;

  it("accepts a 4-column source table preceded by the toggle", () => {
    expect(
      validateSourceToggle("articles/example/index.html", sourceTable(true)),
    ).toEqual([]);
  });

  it("accepts a 4-column source table without the toggle (toggle removed in P2-2)", () => {
    expect(
      validateSourceToggle("articles/example/index.html", sourceTable(false)),
    ).toEqual([]);
  });

  it("accepts a toggle with no 4-column source table (toggle removed in P2-2)", () => {
    const html =
      '<details class="source-toggle"><summary>根拠・確認先を表示</summary></details><div class="table-scroll"><table class="comparison"><thead><tr><th scope="col">比較項目</th><th scope="col">A</th><th scope="col">B</th></tr></thead></table></div>';
    expect(validateSourceToggle("articles/example/index.html", html)).toEqual(
      [],
    );
  });

  it("ignores 3-column tables without a toggle (no false positive)", () => {
    const html =
      '<div class="table-scroll"><table class="comparison"><thead><tr><th scope="col">比較項目</th><th scope="col">A</th><th scope="col">B</th></tr></thead></table></div>';
    expect(validateSourceToggle("articles/example/index.html", html)).toEqual(
      [],
    );
  });

  it("ignores non-article pages", () => {
    expect(validateSourceToggle("index.html", sourceTable(false))).toEqual([]);
  });
});

describe("article card thumbnails (image or text tile)", () => {
  const card = (attrs: string, inner: string) =>
    `<article class="card article-list-card" ${attrs}>${inner}<div class="card-body"><h2><a href="/articles/x/">タイトル</a></h2></div></article>`;
  const imageCard = card(
    'data-content-type="comparison" data-thumb="image"',
    '<img class="card-thumb" src="/products/x.jpg" alt="タイトル">',
  );
  const tileCard = card(
    'data-content-type="comparison" data-thumb="tile"',
    '<div class="card-tile" role="img" aria-label="商品比較：育児用品"><span class="card-tile-label">育児用品</span></div>',
  );

  it("accepts an image thumbnail card", () => {
    expect(validateArticleCardThumbnails("index.html", imageCard)).toEqual([]);
  });

  it("accepts a text-tile card", () => {
    expect(validateArticleCardThumbnails("index.html", tileCard)).toEqual([]);
  });

  it("rejects a card without data-thumb", () => {
    const html = card('data-content-type="comparison"', "");
    expect(validateArticleCardThumbnails("index.html", html)).toEqual([
      'index.html: article card must declare data-thumb="image|tile", found null',
    ]);
  });

  it("rejects data-thumb=image without an img", () => {
    const html = card('data-content-type="comparison" data-thumb="image"', "");
    expect(validateArticleCardThumbnails("index.html", html)).toEqual([
      'index.html: data-thumb="image" card must render exactly one img.card-thumb (img=false, tile=false)',
    ]);
  });

  it("rejects a tile card with an empty label", () => {
    const html = card(
      'data-content-type="comparison" data-thumb="tile"',
      '<div class="card-tile" role="img"><span class="card-tile-label"> </span></div>',
    );
    expect(validateArticleCardThumbnails("index.html", html)).toEqual([
      'index.html: data-thumb="tile" card must render a card-tile with a non-empty label (img=false, tile=true, label="")',
    ]);
  });

  it("ignores compact cards without data-content-type (related/memo/tool)", () => {
    const relatedCard =
      '<article class="card article-list-card"><span class="tag">育児用品</span><h3><a href="/articles/x/">タイトル</a></h3><p>概要</p></article>';
    expect(
      validateArticleCardThumbnails("articles/x/index.html", relatedCard),
    ).toEqual([]);
  });

  it("ignores pages without article cards", () => {
    expect(
      validateArticleCardThumbnails(
        "about/index.html",
        "<main><p>hi</p></main>",
      ),
    ).toEqual([]);
  });
});

describe("article card audiences (向き line)", () => {
  const card = (inner: string) =>
    `<article class="card article-list-card" data-content-type="comparison" data-thumb="image">${inner}</article>`;
  const bodyWithAudiences =
    '<div class="card-body"><p class="card-audiences">向き: 軽さ重視・機能重視</p></div>';

  it("accepts a card with the 向き line", () => {
    expect(
      validateArticleCardAudiences(
        "articles/index.html",
        card(bodyWithAudiences),
      ),
    ).toEqual([]);
  });

  it("rejects a card without the 向き line", () => {
    const html = card(
      '<div class="card-body"><p class="card-desc">概要</p></div>',
    );
    expect(validateArticleCardAudiences("articles/index.html", html)).toEqual([
      "articles/index.html: article card must render a card-audiences line with the 向き selection",
    ]);
  });

  it("rejects an empty 向き line", () => {
    const html = card(
      '<div class="card-body"><p class="card-audiences"> </p></div>',
    );
    expect(validateArticleCardAudiences("articles/index.html", html)).toEqual([
      "articles/index.html: article card must render a card-audiences line with the 向き selection",
    ]);
  });

  it("ignores compact cards without data-content-type", () => {
    const relatedCard =
      '<article class="card article-list-card"><h3><a href="/articles/x/">タイトル</a></h3></article>';
    expect(
      validateArticleCardAudiences("articles/x/index.html", relatedCard),
    ).toEqual([]);
  });

  it("ignores pages without article cards", () => {
    expect(
      validateArticleCardAudiences(
        "about/index.html",
        "<main><p>hi</p></main>",
      ),
    ).toEqual([]);
  });
});

describe("article card subjects (型番行)", () => {
  const card = (contentType: string, inner: string) =>
    `<article class="card article-list-card" data-content-type="${contentType}" data-thumb="image">${inner}</article>`;
  const subjectsBody =
    '<div class="card-body"><p class="card-subjects">JNL-S500 / MTA-J050</p><p class="card-audiences">向き: 軽さ重視・機能重視</p></div>';

  it("accepts a comparison card with the 型番 line", () => {
    expect(
      validateArticleCardSubjects(
        "articles/index.html",
        card("comparison", subjectsBody),
      ),
    ).toEqual([]);
  });

  it("rejects a comparison card without the 型番 line", () => {
    const html = card(
      "comparison",
      '<div class="card-body"><p class="card-audiences">向き: 軽さ重視</p></div>',
    );
    expect(validateArticleCardSubjects("articles/index.html", html)).toEqual([
      "articles/index.html: comparison article card must render a card-subjects line with the A/B model numbers",
    ]);
  });

  it("rejects an empty 型番 line", () => {
    const html = card(
      "comparison",
      '<div class="card-body"><p class="card-subjects"> </p></div>',
    );
    expect(validateArticleCardSubjects("articles/index.html", html)).toEqual([
      "articles/index.html: comparison article card must render a card-subjects line with the A/B model numbers",
    ]);
  });

  it("ignores guide cards (single product has no pair)", () => {
    expect(
      validateArticleCardSubjects(
        "articles/index.html",
        card(
          "guide",
          '<div class="card-body"><p class="card-audiences">向き: 軽さ重視</p></div>',
        ),
      ),
    ).toEqual([]);
  });

  it("ignores cards without data-content-type", () => {
    const relatedCard =
      '<article class="card article-list-card"><h3><a href="/articles/x/">タイトル</a></h3></article>';
    expect(
      validateArticleCardSubjects("articles/x/index.html", relatedCard),
    ).toEqual([]);
  });
});

describe("top page search form", () => {
  const topPage = (form: string) => `<main>${form}</main>`;
  const validForm =
    '<form class="top-search" role="search" data-top-search action="/articles/" method="get"><input type="search" name="q" /><button type="submit">検索</button></form>';

  it("accepts the top search form", () => {
    expect(validateTopSearch("index.html", topPage(validForm))).toEqual([]);
  });

  it("rejects a top page without the search form", () => {
    expect(validateTopSearch("index.html", "<main><p>hi</p></main>")).toEqual([
      "index.html: top page must render a search form with data-top-search",
    ]);
  });

  it("rejects a form without the q input", () => {
    const html = topPage(validForm.replace('name="q"', ""));
    expect(validateTopSearch("index.html", html)).toEqual([
      "index.html: top search form must contain an input named q",
    ]);
  });

  it("rejects a form not submitting to /articles/", () => {
    const html = topPage(
      validForm.replace('action="/articles/"', 'action="/tools/"'),
    );
    expect(validateTopSearch("index.html", html)).toEqual([
      'index.html: top search form must submit to action="/articles/"',
    ]);
  });

  it("ignores non-top pages", () => {
    expect(
      validateTopSearch("articles/index.html", topPage(validForm)),
    ).toEqual([]);
  });
});

describe("header mobile menu (validateHeaderNav)", () => {
  const header = (inner: string) => `<header>${inner}</header>`;
  const validHeader = header(
    '<div class="wrap nav"><a class="brand" href="/">サイト</a><details class="nav-toggle"><summary>メニュー</summary><nav class="navlinks"><a href="/articles/">比較記事</a></nav></details></div>',
  );

  it("accepts the logo + nav-toggle + navlinks header", () => {
    expect(validateHeaderNav("index.html", validHeader)).toEqual([]);
  });

  it("rejects a page without a header", () => {
    expect(validateHeaderNav("index.html", "<main>hi</main>")).toEqual([
      "index.html: page must render a header",
    ]);
  });

  it("rejects a header without the nav-toggle details", () => {
    expect(
      validateHeaderNav(
        "index.html",
        header('<a class="brand" href="/">サイト</a>'),
      ),
    ).toEqual([
      'index.html: header must render the mobile menu (<details class="nav-toggle">)',
    ]);
  });

  it("rejects a non-nested nav-toggle (summary/nav outside details)", () => {
    expect(
      validateHeaderNav(
        "index.html",
        header(
          '<details class="nav-toggle"></details><summary>x</summary><nav class="navlinks"></nav>',
        ),
      ),
    ).toEqual([
      "index.html: nav-toggle must contain a <summary> (hamburger trigger)",
      "index.html: nav-toggle must contain the nav.navlinks link group",
    ]);
  });

  it("rejects a nav-toggle without a summary trigger", () => {
    expect(
      validateHeaderNav(
        "index.html",
        header(
          '<details class="nav-toggle"><nav class="navlinks"><a href="/">x</a></nav></details>',
        ),
      ),
    ).toEqual([
      "index.html: nav-toggle must contain a <summary> (hamburger trigger)",
    ]);
  });

  it("rejects a nav-toggle without the navlinks group", () => {
    expect(
      validateHeaderNav(
        "index.html",
        header(
          '<details class="nav-toggle"><summary>メニュー</summary></details>',
        ),
      ),
    ).toEqual([
      "index.html: nav-toggle must contain the nav.navlinks link group",
    ]);
  });
});

describe("comparison card labels script (validateComparisonCardLabels)", () => {
  const withTable = (table: string) =>
    `<main>${table}</main><!-- comparison-card-labels -->`;

  it("accepts a comparison table with the label script marker", () => {
    expect(
      validateComparisonCardLabels(
        "articles/x/index.html",
        withTable('<table class="comparison"><thead></thead></table>'),
      ),
    ).toEqual([]);
  });

  it("rejects a comparison table without the label script", () => {
    expect(
      validateComparisonCardLabels(
        "articles/x/index.html",
        '<table class="comparison"><thead></thead></table>',
      ),
    ).toEqual([
      "articles/x/index.html: pages with a comparison table must include the comparison-card-labels script",
    ]);
  });

  it("accepts a comparison table with data-label on every cell", () => {
    const table =
      '<table class="comparison"><thead><tr><th>比較項目</th><th>A</th><th>B</th></tr></thead><tbody><tr><th scope="row">容量</th><td data-label="A">1L</td><td data-label="B">2L</td></tr></tbody></table>';
    expect(
      validateComparisonCardLabels("articles/x/index.html", withTable(table)),
    ).toEqual([]);
  });

  it("rejects a comparison table whose cells lack data-label", () => {
    const table =
      '<table class="comparison"><thead><tr><th>比較項目</th><th>A</th><th>B</th></tr></thead><tbody><tr><th scope="row">容量</th><td>1L</td><td data-label="B">2L</td></tr></tbody></table>';
    expect(
      validateComparisonCardLabels("articles/x/index.html", withTable(table)),
    ).toEqual([
      "articles/x/index.html: comparison table cells must carry a data-label (mobile card view needs it)",
    ]);
  });

  it("ignores pages without a comparison table", () => {
    expect(
      validateComparisonCardLabels("index.html", "<main>no table</main>"),
    ).toEqual([]);
  });
});

describe("article trust line (compressed header)", () => {
  const checkedAtMeta = (date: string) =>
    `<meta name="article:product-info-checked-at" content="${date}">`;
  const datedLine = (date: string) =>
    `<p class="trust-line">✓ 公式確認済み（${date}）・広告を含みます</p>`;
  const draftLine = '<p class="trust-line">広告を含みます</p>';

  it("accepts the compressed trust line with a date matching the meta", () => {
    expect(
      validateArticleTrustLine(
        "articles/x/index.html",
        `${checkedAtMeta("2026-08-16")}${datedLine("2026-08-16")}`,
      ),
    ).toEqual([]);
  });

  it("accepts the date-less draft line when no checked-at meta exists", () => {
    expect(
      validateArticleTrustLine("articles/x/index.html", draftLine),
    ).toEqual([]);
  });

  it("rejects a date-less line when the meta declares a checked date", () => {
    const errors = validateArticleTrustLine(
      "articles/x/index.html",
      `${checkedAtMeta("2026-08-16")}${draftLine}`,
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("trust-line must be");
    expect(errors[0]).toContain("✓ 公式確認済み（2026-08-16）・広告を含みます");
    expect(errors[0]).toContain('meta checkedAt="2026-08-16"');
  });

  it("rejects a missing trust line", () => {
    expect(
      validateArticleTrustLine("articles/x/index.html", "<main/>"),
    ).toEqual([
      "articles/x/index.html: expected exactly one trust-line, found 0",
    ]);
  });

  it("rejects two trust lines", () => {
    expect(
      validateArticleTrustLine(
        "articles/x/index.html",
        `${checkedAtMeta("2026-08-16")}${datedLine("2026-08-16")}${datedLine("2026-08-16")}`,
      ),
    ).toEqual([
      "articles/x/index.html: expected exactly one trust-line, found 2",
    ]);
  });

  it("rejects legacy hero trust text and ad notice", () => {
    const html = `${checkedAtMeta("2026-08-16")}${datedLine(
      "2026-08-16",
    )}<p>公式情報確認済み · 2026-08-16</p><p class="notice">広告表示：この記事には広告リンクを含みます。価格・在庫は販売先で、仕様は公式ページで確認してください。</p>`;
    expect(validateArticleTrustLine("articles/x/index.html", html)).toEqual([
      'articles/x/index.html: legacy hero trust text "公式情報確認済み · " found',
      'articles/x/index.html: legacy ad notice "広告表示：この記事には広告リンクを含みます" found',
    ]);
  });

  it("ignores non-article pages", () => {
    expect(
      validateArticleTrustLine("index.html", "<main><p>hi</p></main>"),
    ).toEqual([]);
  });
});

describe("article next-step block (conclusion → 次にすること: A/B購入 + 30秒診断)", () => {
  const contentTypeMeta = (type: string) =>
    `<meta name="article:content-type" content="${type}">`;
  const nextStep = (
    diagnosisHref = "/tools/product-finder/",
    opts: { buyHrefs?: [string, string]; buyCount?: number } = {},
  ) => {
    const buyHrefs = opts.buyHrefs ?? [
      "https://a.r10.to/one",
      "https://a.r10.to/two",
    ];
    const buyCount = opts.buyCount ?? buyHrefs.length;
    const buys = Array.from({ length: buyCount }, (_, index) => {
      const href = buyHrefs[index] ?? "https://a.r10.to/extra";
      return `<a class="next-step__buy" href="${href}" rel="sponsored nofollow noopener noreferrer" data-cta-event="purchase" data-placement="next-step">商品${index + 1}を見る（広告）</a>`;
    }).join("");
    return `<section class="next-step" data-next-step aria-label="次にすること"><div class="next-step__grid">${buys}</div><p class="next-step__diagnosis">まだ迷っている？<a class="next-step__diagnosis-link" href="${diagnosisHref}">30秒で診断する →</a></p></section>`;
  };
  const comparisonWith = (extra: string, specs = false) =>
    `${contentTypeMeta("comparison")}<meta name="article:purchase-link-status" content="verified"><article>${extra}${
      specs
        ? '<details class="fold-section" id="specs"><summary>詳細仕様</summary></details>'
        : ""
    }</article>`;

  it("accepts exactly one next-step block on a comparison article", () => {
    expect(
      validateArticleNextStep(
        "articles/x/index.html",
        comparisonWith(nextStep("/tools/product-finder/baby-bottle/"), true),
      ),
    ).toEqual([]);
  });

  it("accepts the diagnosis index href as a valid destination", () => {
    expect(
      validateArticleNextStep(
        "articles/x/index.html",
        comparisonWith(nextStep(), true),
      ),
    ).toEqual([]);
  });

  it("rejects a comparison article without a next-step block", () => {
    expect(
      validateArticleNextStep(
        "articles/x/index.html",
        comparisonWith("<p>まとめ：候補です。</p>", true),
      ),
    ).toEqual([
      "articles/x/index.html: comparison article must render exactly one next-step block (section.next-step[data-next-step]), found 0",
    ]);
  });

  it("rejects a block whose diagnosis link is not a diagnosis page", () => {
    const errors = validateArticleNextStep(
      "articles/x/index.html",
      comparisonWith(nextStep("https://example.com/"), true),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(
      "next-step diagnosis link must target /tools/product-finder/…",
    );
  });

  it("rejects a block whose purchase button has no real URL", () => {
    const errors = validateArticleNextStep(
      "articles/x/index.html",
      comparisonWith(
        nextStep("/tools/product-finder/", {
          buyHrefs: ["", "https://a.r10.to/two"],
        }),
        true,
      ),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(
      "next-step purchase button 1 must have a real purchase URL",
    );
  });

  it("rejects a block placed after the specs fold", () => {
    const html =
      `${contentTypeMeta("comparison")}<meta name="article:purchase-link-status" content="verified"><details class="fold-section" id="specs"><summary>詳細仕様</summary></details>` +
      nextStep();
    const errors = validateArticleNextStep("articles/x/index.html", html);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(
      "next-step block must appear before the spec section (#specs)",
    );
  });

  it("rejects a legacy standalone diagnosis CTA on any article", () => {
    const legacy =
      '<section class="diagnosis-cta"><a class="diagnosis-cta__button" href="/tools/product-finder/">診断をはじめる</a></section>';
    const errors = validateArticleNextStep(
      "articles/x/index.html",
      comparisonWith(`${legacy}${nextStep()}`, true),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(
      "legacy diagnosis CTA (diagnosis-cta) must be replaced by the next-step block",
    );
  });

  it("rejects a guide article that renders a next-step block", () => {
    expect(
      validateArticleNextStep(
        "articles/tiger-mta-j050-guide/index.html",
        `${contentTypeMeta("guide")}${nextStep()}`,
      ),
    ).toEqual([
      "articles/tiger-mta-j050-guide/index.html: guide article must not render a next-step block, found 1",
    ]);
  });

  it("accepts a guide article without a next-step block", () => {
    expect(
      validateArticleNextStep(
        "articles/panasonic-eh-na9m-guide/index.html",
        `${contentTypeMeta("guide")}<main>ガイド本文</main>`,
      ),
    ).toEqual([]);
  });

  it("ignores non-article pages", () => {
    expect(validateArticleNextStep("index.html", nextStep())).toEqual([]);
  });
});

describe("article section order (validateArticleSectionOrder)", () => {
  function comparisonMeta() {
    return '<meta name="article:content-type" content="comparison"><meta name="article:product-count" content="2">';
  }
  function guideMeta() {
    return '<meta name="article:content-type" content="guide"><meta name="article:product-count" content="1">';
  }
  function comparisonPageBody() {
    return (
      '<p class="meta">breadcrumb</p>' +
      "<h1>headline</h1>" +
      '<p class="lead">lead text</p>' +
      '<nav class="jump-nav">links</nav>' +
      '<section class="article-comparison-v2">comparison</section>' +
      '<details id="specs">specs</details>' +
      '<h2 id="official">official</h2>' +
      '<h2 id="faq">FAQ</h2>' +
      '<div class="purchase-cards">cards</div>' +
      '<ol class="change-log">log</ol>' +
      '<ul class="source-list">sources</ul>'
    );
  }
  function commercialPageBody() {
    return (
      '<p class="meta">breadcrumb</p>' +
      "<h1>headline</h1>" +
      '<p class="trust-line">trust</p>' +
      '<section class="next-step" data-next-step>next</section>' +
      '<h2 id="faq">FAQ</h2>' +
      '<div class="purchase-cards">cards</div>' +
      '<ol class="change-log">log</ol>'
    );
  }

  it("accepts correct order for comparison page articles", () => {
    expect(
      validateArticleSectionOrder(
        "articles/sharp-kc-s50-vs-fu-s50/index.html",
        comparisonMeta() + comparisonPageBody(),
      ),
    ).toEqual([]);
  });

  it("accepts correct order for commercial page articles", () => {
    expect(
      validateArticleSectionOrder(
        "articles/anessa/index.html",
        comparisonMeta() + commercialPageBody(),
      ),
    ).toEqual([]);
  });

  it("rejects reversed sections in comparison page", () => {
    const bad =
      '<p class="meta">breadcrumb</p>' +
      '<section class="article-comparison-v2">comparison</section>' +
      "<h1>headline</h1>" +
      '<p class="lead">lead text</p>';
    expect(
      validateArticleSectionOrder(
        "articles/test-reversed/index.html",
        comparisonMeta() + bad,
      ),
    ).toEqual(
      expect.arrayContaining([expect.stringContaining("appears before")]),
    );
  });

  it("skips guide articles", () => {
    expect(
      validateArticleSectionOrder(
        "articles/guide/index.html",
        guideMeta() + "<main>guide</main>",
      ),
    ).toEqual([]);
  });

  it("skips non-article pages", () => {
    expect(
      validateArticleSectionOrder(
        "index.html",
        comparisonMeta() + comparisonPageBody(),
      ),
    ).toEqual([]);
  });

  it("skips articles without comparison-v2 or next-step (manual articles)", () => {
    expect(
      validateArticleSectionOrder(
        "articles/manual/index.html",
        comparisonMeta() + "<main>manual</main>",
      ),
    ).toEqual([]);
  });

  it("skips trust-line appearing inside nested comparison-v2", () => {
    const nested =
      '<p class="meta">breadcrumb</p>' +
      "<h1>headline</h1>" +
      '<p class="lead">lead</p>' +
      '<nav class="jump-nav">links</nav>' +
      '<section class="article-comparison-v2">comparison' +
      '<p class="trust-line">trust inside v2</p>' +
      "</section>" +
      '<details id="specs">specs</details>';
    expect(
      validateArticleSectionOrder(
        "articles/nested/index.html",
        comparisonMeta() + nested,
      ),
    ).toEqual([]);
  });

  it("rejects repeated Japanese punctuation in rendered body text", () => {
    expect(
      validateRepeatedJapanesePunctuation(
        "dist/articles/example/index.html",
        "<p>正常です。</p><script>const x = '。。';</script><p>破損です。。</p>",
      ),
    ).toEqual([
      "dist/articles/example/index.html: [punctuation] repeated Japanese punctuation remains in rendered HTML: 。。",
    ]);
  });

  it("accepts normal Japanese sentence punctuation", () => {
    expect(
      validateRepeatedJapanesePunctuation(
        "dist/articles/example/index.html",
        "<p>正常です。次です！疑問です？</p>",
      ),
    ).toEqual([]);
  });
});
