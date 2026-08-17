import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { articleMetadata } from "../src/content/articles";
import { ARTICLE_LAYOUT, contentTypeFor } from "../config/article-layout.mjs";

// 実ビルド（astro build）後の dist を検証する。verify チェーンは build の後に
// vitest を実行するため、CI では常に dist が存在する。
const topHtml = readFileSync("dist/index.html", "utf8");
const articlesIndexHtml = readFileSync("dist/articles/index.html", "utf8");

// 期待するカテゴリ集合は articleMetadata と config（topPage.categoryMinArticles）
// から導出する（トップページの実装と同一ロジック）。
const categoryCounts = new Map<string, number>();
for (const article of articleMetadata) {
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

    // config のパスはすべて articleMetadata に存在する（存在しないパスはゲートも落とす）
    for (const path of ARTICLE_LAYOUT.topPage.featuredPaths) {
      expect(articleMetadata.some((article) => article.path === path)).toBe(
        true,
      );
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

    // 各カテゴリの件数ラベルが articleMetadata の実数と一致する
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

describe("article card content types (rendered dist)", () => {
  // カード全体（class に article-list-card を含む <article> 要素）を列挙する。
  const cards = (html: string) =>
    [
      ...html.matchAll(
        /<article\b[^>]*class="[^"]*\barticle-list-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/g,
      ),
    ].map((match) => match[0]);

  it("tags every article card on the top page with its content type", () => {
    const tags = cards(topHtml);
    // 商品診断カード（/tools/ へのリンク）は記事ではないため対象外
    const articleCards = tags.filter((card) => !card.includes('href="/tools/'));
    expect(articleCards.length).toBeGreaterThan(0);
    for (const card of articleCards) {
      const match = card.match(/\bdata-content-type="(guide|comparison)"/);
      expect(match).not.toBeNull();
      // データ属性の値に対応するラベルタグが同じカード内に表示される
      const label =
        ARTICLE_LAYOUT.contentTypes[match![1] as "guide" | "comparison"].label;
      expect(card).toContain(`>${label}</span>`);
    }
  });

  it("tags every article card in the articles index with its content type", () => {
    const tags = cards(articlesIndexHtml);
    expect(tags.length).toBeGreaterThan(0);
    for (const card of tags) {
      expect(card).toMatch(/\bdata-content-type="(guide|comparison)"/);
    }
  });

  it("renders the guide label on the article card of the single-product article", () => {
    // KX-HC705（唯一の商品ガイド）は記事一覧の 2 ページ目に載る
    const guideLabel = ARTICLE_LAYOUT.contentTypes.guide.label;
    const page2 = readFileSync("dist/articles/page/2/index.html", "utf8");
    expect(page2).toContain("panasonic-baby-monitor-kx-hc705");
    expect(page2).toContain(`>${guideLabel}</span>`);
  });

  it("keeps the card tag labels consistent with the article metadata", () => {
    // 現行データではトップページの記事カードは全て比較記事（featured 5 件 +
    // 最新 6 件）なので、比較記事ラベルが描画される。
    const comparisonLabel = ARTICLE_LAYOUT.contentTypes.comparison.label;
    expect(topHtml).toContain(`>${comparisonLabel}</span>`);
    for (const href of ARTICLE_LAYOUT.topPage.featuredPaths) {
      const article = articleMetadata.find((entry) => entry.path === href);
      expect(article).toBeDefined();
      expect(contentTypeFor(article!.productCount)).toBe("comparison");
    }
  });
});
