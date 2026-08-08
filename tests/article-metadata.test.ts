import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  articleMetadata,
  defineArticleMetadata,
  merriesNewbornArticle,
  pampersNewbornArticle,
} from "../src/content/articles";

function extractJsonLd(html: string): Record<string, unknown>[] {
  return [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => JSON.parse(match[1] ?? "{}") as Record<string, unknown>);
}

describe("article metadata", () => {
  it("keeps one typed canonical source for article listings and pages", () => {
    expect(articleMetadata).toEqual([
      pampersNewbornArticle,
      merriesNewbornArticle,
    ]);
    expect(pampersNewbornArticle.path).toBe("/articles/pampers-newborn/");
    expect(
      pampersNewbornArticle.modifiedAt >= pampersNewbornArticle.publishedAt,
    ).toBe(true);
    expect(merriesNewbornArticle.path).toBe("/articles/merries-newborn/");
    expect(
      merriesNewbornArticle.modifiedAt >= merriesNewbornArticle.publishedAt,
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
    expect(article).not.toHaveProperty("image");
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
