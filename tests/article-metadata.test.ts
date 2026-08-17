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
  panasonicBabyMonitorArticle,
  pigeonBottle240Article,
  pigeonSlim240Article,
  thermosTigerBottleArticle,
  tefalKettleArticle,
  pigeonBottleSizeArticle,
  pottyArticle,
  shupotArticle,
  sharpKcS50VsFuS50Article,
  yamazakiTowerDeskPanelArticle,
  yamazakiCondorWagonArticle,
  yamazakiFreeBroomArticle,
  yamazakiDustWagonArticle,
  zojirushiElectricKettleArticle,
  tefalGarmentSteamerArticle,
  kingjimTepraArticle,
  panasonicFyhvx120VsFyhvx90Article,
  panasonicNeFl1aVsNeFl1cArticle,
  thermosKfm020VsKfi020Article,
  tigerMtaJ050GuideArticle,
  panasonicEhNa9mVsEhNa7mArticle,
  additionalCommercialArticles,
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
      tefalKettleArticle,
      panasonicNeFl1aVsNeFl1cArticle,
      sharpKcS50VsFuS50Article,
      thermosTigerBottleArticle,
      yamazakiTowerDeskPanelArticle,
      yamazakiCondorWagonArticle,
      yamazakiFreeBroomArticle,
      yamazakiDustWagonArticle,
      zojirushiElectricKettleArticle,
      tefalGarmentSteamerArticle,
      kingjimTepraArticle,
      panasonicFyhvx120VsFyhvx90Article,
      panasonicBabyMonitorArticle,
      thermosKfm020VsKfi020Article,
      tigerMtaJ050GuideArticle,
      panasonicEhNa9mVsEhNa7mArticle,
      ...additionalCommercialArticles,
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

  it("requires every article to declare a positive product count", () => {
    for (const article of articleMetadata) {
      expect(
        Number.isInteger(article.productCount) && article.productCount >= 1,
      ).toBe(true);
    }
    // 比較記事は productCount: 2、単一商品記事は productCount: 1。
    expect(
      articleMetadata.filter((article) => article.productCount === 2),
    ).toHaveLength(56);
    expect(
      articleMetadata.filter((article) => article.productCount === 1),
    ).toEqual([panasonicBabyMonitorArticle]);
  });

  it("rejects invalid product counts", () => {
    expect(() =>
      defineArticleMetadata({
        ...pampersNewbornArticle,
        productCount: 0,
      }),
    ).toThrow("productCount must be a positive integer");
    expect(() =>
      defineArticleMetadata({
        ...pampersNewbornArticle,
        productCount: 1.5,
      }),
    ).toThrow("productCount must be a positive integer");
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

  it("renders the product count meta for article pages", () => {
    const html = readFileSync(
      "dist/articles/pampers-newborn/index.html",
      "utf8",
    );
    expect(html).toContain(
      `<meta name="article:product-count" content="${pampersNewbornArticle.productCount}">`,
    );
  });

  it("renders no mid-cta meta after the v3 shortening (no long articles)", () => {
    // v3 短縮で旧育児記事を含む全記事が短文化されたため、
    // midArticleCta を宣言する記事は存在せず、mid-cta meta も出力されない。
    expect(
      articleMetadata.filter((article) => article.midArticleCta === true),
    ).toEqual([]);
    const pampersHtml = readFileSync(
      "dist/articles/pampers-newborn/index.html",
      "utf8",
    );
    expect(pampersHtml).not.toContain('name="article:mid-cta"');
    expect(pampersNewbornArticle.midArticleCta).toBeUndefined();
    expect(sharpKcS50VsFuS50Article.midArticleCta).toBeUndefined();
  });

  it("renders the single-product count for the single-product check article", () => {
    const html = readFileSync(
      "dist/articles/panasonic-baby-monitor-kx-hc705/index.html",
      "utf8",
    );
    expect(html).toContain(`<meta name="article:product-count" content="1">`);
    expect(panasonicBabyMonitorArticle.productCount).toBe(1);
  });

  it("marks the single-product article as a guide without a comparison section", () => {
    const html = readFileSync(
      "dist/articles/panasonic-baby-monitor-kx-hc705/index.html",
      "utf8",
    );
    expect(html).toContain(
      `<meta name="article:content-type" content="guide">`,
    );
    // 商品ガイドは比較セクション（ArticleComparisonV2）を持たない
    expect(html).not.toContain("article-comparison-v2");
    // 記事の meta 行にコンテンツタイプが表示される
    expect(html).toContain("商品ガイド");
    // 内部メモ（サンプル）と v3 で廃止した表示が残っていない
    expect(html).not.toContain("サンプル");
    expect(html).not.toContain("verification-summary");
  });

  it("marks a two-product article as a comparison with a comparison section", () => {
    const html = readFileSync(
      "dist/articles/zojirushi-ck-pa08-vs-ck-dc08/index.html",
      "utf8",
    );
    expect(html).toContain(
      `<meta name="article:content-type" content="comparison">`,
    );
    expect(html).toContain("article-comparison-v2");
  });

  it("keeps ordinary pages as WebPage without article dates", () => {
    const html = readFileSync("dist/about/index.html", "utf8");
    const data = extractJsonLd(html);
    expect(data.some((item) => item["@type"] === "WebPage")).toBe(true);
    expect(html).not.toContain("article:published_time");
    expect(html).not.toContain("article:product-count");
  });
});
