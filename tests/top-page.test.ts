import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { publicArticleMetadata } from "../src/content/articles";
import { ARTICLE_LAYOUT } from "../config/article-layout.mjs";

// 実ビルド（astro build）後の dist を検証する。verify チェーンは build の後に
// vitest を実行するため、CI では常に dist が存在する。
const topHtml = readFileSync("dist/index.html", "utf8");
const articlesIndexHtml = readFileSync("dist/articles/index.html", "utf8");

// 期待するカテゴリ集合は publicArticleMetadata と config（topPage.categoryMinArticles）
// から導出する（トップページの実装と同一ロジック）。
const categoryCounts = new Map<string, number>();
for (const article of publicArticleMetadata) {
  categoryCounts.set(
    article.category,
    (categoryCounts.get(article.category) ?? 0) + 1,
  );
}
const expectedCategories = [...categoryCounts.entries()]
  .filter(([, count]) => count >= ARTICLE_LAYOUT.topPage.categoryMinArticles)
  .sort(
    ([aName, aCount], [bName, bCount]) =>
      bCount - aCount || (aName < bName ? -1 : aName > bName ? 1 : 0),
  );

describe("top page (rendered dist)", () => {
  it("links every config topPage.featuredPaths article and nothing else", () => {
    expect(ARTICLE_LAYOUT.topPage.featuredPaths.length).toBeGreaterThanOrEqual(
      3,
    );
    expect(ARTICLE_LAYOUT.topPage.featuredPaths.length).toBeLessThanOrEqual(6);

    // config のパスはすべて publicArticleMetadata に存在する（存在しないパスはゲートも落とす）
    for (const path of ARTICLE_LAYOUT.topPage.featuredPaths) {
      expect(
        publicArticleMetadata.some((article) => article.path === path),
      ).toBe(true);
    }

    const section = topHtml.match(
      /<section\b[^>]*data-top-featured[^>]*>([\s\S]*?)<\/section\s*>/i,
    );
    expect(section).not.toBeNull();
    const hrefs = [...section![1].matchAll(/href="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(hrefs).toEqual(ARTICLE_LAYOUT.topPage.featuredPaths);
  });

  it("renders category entries for categories with >= categoryMinArticles articles", () => {
    const section = topHtml.match(
      /<section\b[^>]*data-top-categories[^>]*>([\s\S]*?)<\/section\s*>/i,
    );
    expect(section).not.toBeNull();
    const links = [
      ...section![1].matchAll(/href="\/articles\/\?category=([^"]+)"/g),
    ].map((match) => decodeURIComponent(match[1]));
    expect(links).toEqual(expectedCategories.map(([name]) => name));

    // 各カテゴリの件数ラベルが publicArticleMetadata の実数と一致する
    for (const [name, count] of expectedCategories) {
      expect(section![1]).toContain(`${name}</span>`);
      expect(section![1]).toContain(`${count}件`);
    }
  });

  it("keeps the category entry set consistent with the articles index options", () => {
    const optionCategories = [
      ...articlesIndexHtml.matchAll(/<option value="([^"]+)">/g),
    ].map((match) => match[1]);
    for (const [name] of expectedCategories) {
      expect(optionCategories).toContain(name);
    }
  });
});
