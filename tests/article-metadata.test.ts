import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  articleMetadata,
  babybjornArticle,
  babybjornBouncerArticle,
  babybjornOnekaiArticle,
  cradleArticle,
  combiTheSArticle,
  tigerRiceArticle,
  panasonicVacuumArticle,
  panasonicHairDryerArticle,
  defineArticleMetadata,
  merriesNewbornArticle,
  merriesPantsArticle,
  moonyMArticle,
  pampersNewbornArticle,
  pigeonBottle240Article,
  pigeonSlim240Article,
  thermosTigerBottleArticle,
  pigeonBottleSizeArticle,
  pottyArticle,
  shupotArticle,
} from "../src/content/articles";

function extractJsonLd(html: string): Record<string, unknown>[] {
  return [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => JSON.parse(match[1] ?? "{}") as Record<string, unknown>);
}

describe("article metadata", () => {
  it("keeps the article page directories synchronized with the canonical master", () => {
    const articlesDir = join(process.cwd(), "src/pages/articles");
    const pagePaths = readdirSync(articlesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) =>
        readdirSync(join(articlesDir, entry.name)).includes("index.astro"),
      )
      .map((entry) => `/articles/${entry.name}/`)
      .sort();
    const metadataPaths = articleMetadata.map((article) => article.path).sort();

    expect(pagePaths).toEqual(metadataPaths);
  });

  it("uses the canonical master for the article index, memo page, and sitemap", () => {
    const articleIndex = readFileSync("src/pages/articles/index.astro", "utf8");
    const memoPage = readFileSync("src/pages/memo.astro", "utf8");
    const sitemap = readFileSync("src/pages/sitemap.xml.ts", "utf8");

    expect(articleIndex).toContain("import {articleMetadata}");
    expect(memoPage).toContain("import { articleMetadata }");
    expect(sitemap).toContain(
      "...articleMetadata.map((article) => article.path)",
    );
    expect(articleIndex).not.toContain("thermos-tiger-bottle");
    expect(memoPage).not.toContain("thermos-tiger-bottle");
    expect(sitemap).not.toContain("thermos-tiger-bottle");
  });

  it("keeps the saved water-bottle article renderable in the memo page", () => {
    const memoPage = readFileSync("src/pages/memo.astro", "utf8");
    const waterBottle = articleMetadata.find(
      (article) => article.id === "thermos-tiger-bottle",
    );

    expect(waterBottle).toBeDefined();
    expect(memoPage).toContain("{articleMetadata.map((article) => (");
    expect(memoPage).toContain("data-memo-item data-article-id={article.id}");
    expect(memoPage).toContain(
      "sanitizeComparisonMemo(localStorage.getItem(comparisonMemoStorageKey), knownIds)",
    );
    expect(articleMetadata.map((article) => article.path)).toContain(
      waterBottle!.path,
    );
  });

  it("keeps one typed canonical source for article listings and pages", () => {
    expect(articleMetadata).toEqual([
      pampersNewbornArticle,
      merriesNewbornArticle,
      merriesPantsArticle,
      pigeonBottle240Article,
      pigeonSlim240Article,
      moonyMArticle,
      shupotArticle,
      babybjornArticle,
      babybjornOnekaiArticle,
      babybjornBouncerArticle,
      cradleArticle,
      pottyArticle,
      pigeonBottleSizeArticle,
      combiTheSArticle,
      tigerRiceArticle,
      panasonicVacuumArticle,
      panasonicHairDryerArticle,
      thermosTigerBottleArticle,
    ]);
    expect(pampersNewbornArticle.path).toBe("/articles/pampers-newborn/");
    expect(
      pampersNewbornArticle.modifiedAt >= pampersNewbornArticle.publishedAt,
    ).toBe(true);
    expect(merriesNewbornArticle.path).toBe("/articles/merries-newborn/");
    expect(
      merriesNewbornArticle.modifiedAt >= merriesNewbornArticle.publishedAt,
    ).toBe(true);
    expect(pigeonBottle240Article.path).toBe("/articles/pigeon-bottle-240/");
    expect(
      pigeonBottle240Article.modifiedAt >= pigeonBottle240Article.publishedAt,
    ).toBe(true);
    expect(pigeonSlim240Article.path).toBe("/articles/pigeon-slim-240/");
    expect(
      pigeonSlim240Article.modifiedAt >= pigeonSlim240Article.publishedAt,
    ).toBe(true);
  });

  it("rejects invalid and contradictory dates", () => {
    expect(() =>
      defineArticleMetadata({
        ...pampersNewbornArticle,
        publishedAt: "2026-02-30",
      }),
    ).toThrow();
    expect(() =>
      defineArticleMetadata({
        ...pampersNewbornArticle,
        publishedAt: "2026-08-01",
        modifiedAt: "2026-07-31",
      }),
    ).toThrow();
  });

  it("renders dates consistently in HTML, meta and Article JSON-LD", () => {
    const html = readFileSync(
      "dist/articles/pampers-newborn/index.html",
      "utf8",
    );
    const article = extractJsonLd(html).find(
      (item) => item["@type"] === "Article",
    );

    expect(article).toBeDefined();
    expect(article?.headline).toBe(pampersNewbornArticle.headline);
    expect(article?.datePublished).toBe(pampersNewbornArticle.publishedAt);
    expect(article?.dateModified).toBe(pampersNewbornArticle.modifiedAt);
    expect(article?.url).toBe(article?.mainEntityOfPage);
    expect(article?.image).toBe(
      new URL(
        pampersNewbornArticle.imagePath!,
        "https://kuraberu-products.pages.dev/",
      ).toString(),
    );
    expect(html).toContain(
      `<meta property="article:published_time" content="${pampersNewbornArticle.publishedAt}">`,
    );
    expect(html).toContain(
      `<meta property="article:modified_time" content="${pampersNewbornArticle.modifiedAt}">`,
    );
    expect(html).toContain(`datetime="${pampersNewbornArticle.publishedAt}"`);
    expect(html).toContain(`datetime="${pampersNewbornArticle.modifiedAt}"`);
  });

  it("keeps ordinary pages as WebPage without article dates", () => {
    const html = readFileSync("dist/about/index.html", "utf8");
    const data = extractJsonLd(html);
    expect(data.some((item) => item["@type"] === "WebPage")).toBe(true);
    expect(html).not.toContain("article:published_time");
  });
});
