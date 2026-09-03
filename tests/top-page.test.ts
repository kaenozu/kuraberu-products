import { existsSync, readdirSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import {
  publicArticleMetadata,
  articleMetadata,
} from "../src/content/articles";
import { contentTypeFor, ARTICLE_LAYOUT } from "../config/article-layout.mjs";

// 実ビルド（astro build）後の dist を検証する。verify チェーンは build の後に
// vitest を実行するため、CI では常に dist が存在する。
// 単体実行で dist が無い場合は、理由をログに出して全テストを明示スキップする。
// dist の読み込みは各 describe の beforeAll で行う（スキップ時はフックも
// 実行されないため、コレクション時に読み込んで失敗することがない）。
const hasDist = existsSync("dist");
if (!hasDist) {
  console.warn(
    "skip: dist/ が存在しないため top-page の実ビルド整合テストをスキップしました（astro build 後に再実行してください）",
  );
}

let topHtml: string;
let articlesIndexHtml: string;

function loadRenderedPages(): void {
  topHtml = readFileSync("dist/index.html", "utf8");
  articlesIndexHtml = readFileSync("dist/articles/index.html", "utf8");
}

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
  )
  .slice(0, 6);

describe.skipIf(!hasDist)("top page (rendered dist)", () => {
  beforeAll(loadRenderedPages);

  it("renders the FV search form submitting to /articles/?q=", () => {
    const form = topHtml.match(
      /<form\b[^>]*data-top-search[^>]*>([\s\S]*?)<\/form>/i,
    );
    expect(form).not.toBeNull();
    expect(topHtml).toContain("data-top-search");
    expect(topHtml).toMatch(
      /<form\b[^>]*data-top-search[^>]*action="\/articles\/"/i,
    );
    expect(form![1]).toMatch(/<input\b[^>]*name="q"/);
    expect(form![1]).toMatch(/<button\b[^>]*type="submit"/);
  });

  it("renders category entries for categories with >= categoryMinArticles articles", () => {
    const section = topHtml.match(
      /<section\b[^>]*data-top-categories[^>]*>([\s\S]*?)<\/section\s*>/i,
    );
    expect(section).not.toBeNull();
    const links = [
      ...section![1].matchAll(/href="\/articles\/category\/([^"]+)"/g),
    ].map((match) => decodeURIComponent(match[1]).replace(/\/$/, ""));
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

  it("renders the six newest public articles in the latest section", () => {
    const expected = [...publicArticleMetadata]
      .sort(
        (a, b) =>
          b.publishedAt.localeCompare(a.publishedAt) ||
          b.modifiedAt.localeCompare(a.modifiedAt) ||
          a.path.localeCompare(b.path),
      )
      .slice(0, 6)
      .map((article) => article.path);
    const section = topHtml.match(
      /<section\b[^>]*data-top-latest[^>]*>([\s\S]*?)<\/section\s*>/i,
    );
    expect(section).not.toBeNull();
    const hrefs = [...section![1].matchAll(/href="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(hrefs).toEqual(expected);
  });
});

describe.skipIf(!hasDist)("article card content types (rendered dist)", () => {
  beforeAll(loadRenderedPages);

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

  it("renders every guide article card in the articles list with the guide label", () => {
    // 全ページ送りを含む記事一覧を結合し、ガイド記事が全て
    // data-content-type="guide" のカードとして表示されることを検証する。
    const listHtml = [
      articlesIndexHtml,
      ...readdirSync("dist/articles/page", { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) =>
          readFileSync(`dist/articles/page/${entry.name}/index.html`, "utf8"),
        ),
    ].join("");
    const guideArticles = articleMetadata.filter(
      (article) => contentTypeFor(article.productCount) === "guide",
    );
    expect(guideArticles.length).toBeGreaterThanOrEqual(2);
    const guideTagCount =
      listHtml.match(/data-content-type="guide"/g)?.length ?? 0;
    expect(guideTagCount).toBe(guideArticles.length);
    for (const article of guideArticles) {
      expect(listHtml).toContain(article.path.slice(1, -1));
      expect(listHtml).toContain(
        `>${ARTICLE_LAYOUT.contentTypes.guide.label}</span>`,
      );
    }
  });

  it("keeps the card tag labels consistent with the article metadata", () => {
    // トップページの新着記事カードには比較記事ラベルが描画される。
    const comparisonLabel = ARTICLE_LAYOUT.contentTypes.comparison.label;
    expect(topHtml).toContain(`>${comparisonLabel}</span>`);
  });
});

describe.skipIf(!hasDist)("article card thumbnails (rendered dist)", () => {
  beforeAll(loadRenderedPages);

  const cards = (html: string) =>
    [
      ...html.matchAll(
        /<article\b[^>]*class="[^"]*\barticle-list-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/g,
      ),
    ].map((match) => match[0]);

  // dist の読み込みは beforeAll のスキップガード後に行う（コレクション時に
  // 評価すると dist 無し環境で import 自体が失敗するため遅延させる）。
  const cardPages = (): ReadonlyArray<readonly [string, string]> => [
    ["dist/index.html", topHtml],
    ["dist/articles/index.html", articlesIndexHtml],
    ...readdirSync("dist/articles/page", { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const html = readFileSync(
          `dist/articles/page/${entry.name}/index.html`,
          "utf8",
        );
        return [`dist/articles/page/${entry.name}/index.html`, html] as const;
      }),
  ];

  const isArticleCard = (card: string) => !card.includes('href="/tools/');

  it("renders exactly one thumbnail (image or text tile) on every article card", () => {
    let total = 0;
    let image = 0;
    let tile = 0;
    for (const [page, html] of cardPages()) {
      for (const card of cards(html)) {
        if (!isArticleCard(card)) continue;
        total += 1;
        const thumb = card.match(/\bdata-thumb="(image|tile)"/)?.[1];
        expect(thumb, `${page} card missing data-thumb`).toBeDefined();
        const hasImg = /<img\b[^>]*class="[^"]*\bcard-thumb\b[^"]*"/.test(card);
        const hasTile =
          /<div\b[^>]*class="[^"]*\bcard-tile\b[^"]*"[^>]*>[\s\S]*?card-tile-label/.test(
            card,
          );
        // 画像とテキストタイルはちょうど一方だけ
        expect(hasImg, `${page}: ${card.slice(0, 80)}`).not.toBe(hasTile);
        if (thumb === "image") {
          expect(hasImg, `${page}: data-thumb=image but no img`).toBe(true);
          image += 1;
        } else {
          expect(hasTile, `${page}: data-thumb=tile but no tile`).toBe(true);
          tile += 1;
        }
      }
    }
    expect(total).toBeGreaterThan(0);
    expect(image + tile).toBe(total);
  });

  it("keeps data-thumb consistent with articleMetadata.imagePath", () => {
    for (const [, html] of cardPages()) {
      for (const card of cards(html)) {
        if (!isArticleCard(card)) continue;
        const href = card.match(/<h2><a href="([^"]+)"/)?.[1];
        expect(href).toBeDefined();
        const article = articleMetadata.find((entry) => entry.path === href);
        expect(article, `unknown article path ${href}`).toBeDefined();
        const expected = article!.imagePath ? "image" : "tile";
        expect(card).toContain(`data-thumb="${expected}"`);
      }
    }
  });
});
