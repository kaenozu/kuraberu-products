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
  readArticleMidCta,
  readArticleProductCount,
  validateArticleCtas,
  validateArticleContentType,
  validateArticleCardAudiences,
  validateArticleCardThumbnails,
  validateArticleTrustLine,
  validateTopSearch,
  validateSourceToggle,
  validateRelatedArticleSection,
  validateRenderedExternalEmbedCounts,
  validateRenderedHtml,
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

// 長文の 2 商品記事: 末尾 2 枚 + 途中（after-decision）2 枚 = 4 枚
const fourCtas =
  `${validCta("https://a.r10.to/one", "after-decision")}${validCta(
    "https://a.r10.to/two",
    "after-decision",
  )}` +
  `${validCta("https://a.r10.to/three", "article-end")}${validCta(
    "https://a.r10.to/four",
    "article-end",
  )}`;

// 通常の単一商品記事: 末尾 1 枚
const oneEndCta = validCta("https://a.r10.to/one");

function validPage(body: string) {
  return `<!doctype html>
<html><head><meta name="robots" content="index,follow"><link rel="canonical" href="https://example.invalid/"></head>
<body><main><h1>Fixture</h1>${body}</main></body></html>`;
}

function sectionsOf(html: string) {
  return findEmptySections(html).map(({ level, heading }) => ({
    level,
    heading,
  }));
}

describe("rendered article CTA audit", () => {
  it("accepts exactly two article-end CTAs for a two-product article", () => {
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        twoEndCtas,
        expectedPurchaseCtasPerArticle(2),
      ),
    ).toEqual([]);
  });

  it("accepts four CTAs for a long two-product article (midArticleCta)", () => {
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        fourCtas,
        expectedPurchaseCtasPerArticle(2, ARTICLE_LAYOUT, {
          midArticleCta: true,
        }),
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
      "articles/example/index.html: expected exactly 2 purchase CTAs (per config/article-layout.mjs and article productCount), found 1",
      "articles/example/index.html: CTA 1 is not a Rakuten affiliate URL",
    ]);
  });

  it("accepts a plain Rakuten search fallback CTA with nofollow", () => {
    const searchCta =
      '<a href="https://search.rakuten.co.jp/search/mall/KX-HC705" rel="nofollow noopener noreferrer" data-cta-event="purchase" data-placement="article-end">楽天市場で検索</a>';
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        searchCta,
        expectedPurchaseCtasPerArticle(1),
      ),
    ).toEqual([]);
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
      `${validCta("https://a.r10.to/one", "after-decision")}${validCta(
        "https://a.r10.to/two",
        "after-decision",
      )}` +
      `<a href="https://a.r10.to/three" rel="sponsored nofollow noopener noreferrer" data-cta-event="purchase" data-placement="bogus">商品を確認（広告）</a>` +
      `${validCta("https://a.r10.to/four", "article-end")}`;
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        html,
        expectedPurchaseCtasPerArticle(2, ARTICLE_LAYOUT, {
          midArticleCta: true,
        }),
      ),
    ).toEqual([
      "articles/example/index.html: CTA 3 has unrecognized placement: bogus (allowed: after-decision, article-end)",
    ]);
  });

  it("rejects a mid CTA on a non-long article via per-placement counts", () => {
    // 総数は合う（2 枚）が、article-end が 1 枚しかない v2 混在パターン
    const mixed = `${validCta(
      "https://a.r10.to/one",
      "after-decision",
    )}${validCta("https://a.r10.to/two")}`;
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        mixed,
        expectedPurchaseCtasPerArticle(2),
        expectedPlacementCounts(2),
      ),
    ).toEqual([
      'articles/example/index.html: expected 2 purchase CTAs with placement "article-end", found 1 (per config/article-layout.mjs)',
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

describe("article mid-cta meta", () => {
  it("reads the long-article flag from the rendered meta tag", () => {
    const errors: string[] = [];
    expect(
      readArticleMidCta(
        "articles/example/index.html",
        '<meta name="article:mid-cta" content="true">',
        errors,
      ),
    ).toBe(true);
    expect(
      readArticleMidCta(
        "articles/example/index.html",
        '<meta name="article:mid-cta" content="false">',
        errors,
      ),
    ).toBe(false);
    expect(
      readArticleMidCta("articles/example/index.html", "<html></html>", errors),
    ).toBe(false);
    expect(errors).toEqual([]);
  });

  it("reports an invalid mid-cta value", () => {
    const errors: string[] = [];
    expect(
      readArticleMidCta(
        "articles/example/index.html",
        '<meta name="article:mid-cta" content="yes">',
        errors,
      ),
    ).toBe(false);
    expect(errors).toEqual([
      'articles/example/index.html: invalid article:mid-cta "yes" (must be true or false)',
    ]);
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

  it("derives four CTAs for a long article from the mid-cta meta through validateRenderedHtml", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-ctas-"));
    fixtureDirectories.push(directory);
    const articlesDir = path.join(directory, "articles", "long");
    mkdirSync(articlesDir, { recursive: true });
    writeFileSync(
      path.join(articlesDir, "index.html"),
      validPage(
        `<meta name="article:product-count" content="2"><meta name="article:content-type" content="comparison"><meta name="article:mid-cta" content="true"><p class="trust-line">広告を含みます</p>${fourCtas}`,
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

  it("enforces the 3-6 item range in config", () => {
    expect(ARTICLE_LAYOUT.topPage.featuredPaths.length).toBeGreaterThanOrEqual(
      3,
    );
    expect(ARTICLE_LAYOUT.topPage.featuredPaths.length).toBeLessThanOrEqual(6);
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

  it("rejects a 4-column source table without the toggle", () => {
    expect(
      validateSourceToggle("articles/example/index.html", sourceTable(false)),
    ).toEqual([
      'articles/example/index.html: 根拠・確認先 column table must be preceded by <details class="source-toggle">',
    ]);
  });

  it("rejects a toggle with no 4-column source table (dead toggle)", () => {
    const html =
      '<details class="source-toggle"><summary>根拠・確認先を表示</summary></details><div class="table-scroll"><table class="comparison"><thead><tr><th scope="col">比較項目</th><th scope="col">A</th><th scope="col">B</th></tr></thead></table></div>';
    expect(validateSourceToggle("articles/example/index.html", html)).toEqual([
      "articles/example/index.html: source-toggle present but no 根拠・確認先 column table found",
    ]);
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
