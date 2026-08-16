import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  countRenderedExternalEmbeds,
  findEmptySections,
  readArticleProductCount,
  validateArticleCtas,
  validateRenderedExternalEmbedCounts,
  validateRenderedHtml,
} from "../scripts/check-rendered-html.mjs";
import { expectedPurchaseCtasPerArticle } from "../config/article-layout.mjs";

const fixtureDirectories: string[] = [];

const embed = '<div data-external-embed="x"></div>';

const validCta = (href: string, placement = "after-decision") =>
  `<a href="${href}" rel="sponsored nofollow noopener noreferrer" data-cta-event="purchase" data-placement="${placement}">商品を確認（広告）</a>`;

const twoCtas = `${validCta("https://a.r10.to/one")}${validCta(
  "https://a.r10.to/two",
)}`;

const fourCtas =
  `${validCta("https://a.r10.to/one")}${validCta("https://a.r10.to/two")}` +
  `${validCta("https://a.r10.to/three", "article-end")}${validCta(
    "https://a.r10.to/four",
    "article-end",
  )}`;

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
  it("accepts exactly four complete Rakuten affiliate CTAs for a two-product article", () => {
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        fourCtas,
        expectedPurchaseCtasPerArticle(2),
      ),
    ).toEqual([]);
  });

  it("accepts two CTAs for a single-product article", () => {
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        twoCtas,
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
      "articles/example/index.html: expected exactly 2 purchase CTAs (per config/article-layout.mjs and article productCount), found 4",
    ]);
  });

  it("rejects missing CTA count, disallowed host, and missing nofollow", () => {
    const html =
      '<a href="https://example.com" data-cta-event="purchase" data-placement="after-decision">購入</a>';
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        html,
        expectedPurchaseCtasPerArticle(2),
      ),
    ).toEqual([
      "articles/example/index.html: expected exactly 4 purchase CTAs (per config/article-layout.mjs and article productCount), found 1",
      "articles/example/index.html: CTA 1 is not a Rakuten affiliate URL",
    ]);
  });

  it("rejects a plain Rakuten search fallback CTA", () => {
    const searchCta =
      '<a href="https://search.rakuten.co.jp/search/mall/KX-HC705" rel="nofollow noopener noreferrer" data-cta-event="purchase" data-placement="after-decision">楽天市場で検索</a>';
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        `${searchCta}${searchCta}`,
        expectedPurchaseCtasPerArticle(1),
      ),
    ).toEqual([
      "articles/example/index.html: CTA 1 is not a Rakuten affiliate URL",
      "articles/example/index.html: CTA 2 is not a Rakuten affiliate URL",
    ]);
  });

  it("rejects a placeholder affiliate URL", () => {
    const placeholderCta =
      '<a href="https://a.r10.to/placeholder-kx-hc705" rel="sponsored nofollow noopener noreferrer" data-cta-event="purchase" data-placement="after-decision">商品を確認（広告）</a>';
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        `${placeholderCta}${placeholderCta}`,
        expectedPurchaseCtasPerArticle(1),
      ),
    ).toEqual([
      "articles/example/index.html: CTA 1 must not contain a placeholder URL",
      "articles/example/index.html: CTA 2 must not contain a placeholder URL",
    ]);
  });

  it("rejects a CTA whose placement is not allowed by the layout config", () => {
    const html =
      `${validCta("https://a.r10.to/one")}${validCta("https://a.r10.to/two", "article-end")}` +
      `<a href="https://a.r10.to/three" rel="sponsored nofollow noopener noreferrer" data-cta-event="purchase" data-placement="bogus">商品を確認（広告）</a>` +
      `${validCta("https://a.r10.to/four", "article-end")}`;
    expect(
      validateArticleCtas(
        "articles/example/index.html",
        html,
        expectedPurchaseCtasPerArticle(2),
      ),
    ).toEqual([
      "articles/example/index.html: CTA 3 has unrecognized placement: bogus (allowed: after-decision, article-end)",
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

  it("derives the per-article expected count from the meta tag through validateRenderedHtml", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-ctas-"));
    fixtureDirectories.push(directory);
    const articlesDir = path.join(directory, "articles", "example");
    mkdirSync(articlesDir, { recursive: true });
    writeFileSync(
      path.join(articlesDir, "index.html"),
      validPage(`<meta name="article:product-count" content="1">${twoCtas}`),
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
