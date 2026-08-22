import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  publicArticleMetadata,
  articleMetadata,
} from "../src/content/articles";
import { contentTypeFor, ARTICLE_LAYOUT } from "../config/article-layout.mjs";

// dist 依存テスト用のガード: astro build 済みの成果物が無い環境
// （unit-only の CI ジョブ等）では該当 describe をスキップする。
// ※ このファイルは astro build 後に実行されることを前提とした
//   レンダリング成果物（dist）の検証テスト群である。
const distRenderedHtmlAvailable =
  existsSync("dist/index.html") && existsSync("dist/articles/index.html");

// dist の HTML は it 実行時に初回のみ読み込む（遅延読み取り + キャッシュ）。
// モジュールトップレベルでの読み取りは collection 時に実行され、
// dist 未生成環境でスイートごとクラッシュするため。
let topHtmlCached: string | undefined;
const topHtml = () =>
  (topHtmlCached ??= readFileSync("dist/index.html", "utf8"));
let articlesIndexHtmlCached: string | undefined;
const articlesIndexHtml = () =>
  (articlesIndexHtmlCached ??= readFileSync(
    "dist/articles/index.html",
    "utf8",
  ));

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

describe.skipIf(!distRenderedHtmlAvailable)("top page (rendered dist)", () => {
  it("links every config topPage.featuredPaths article and nothing else", () => {
    expect(ARTICLE_LAYOUT.topPage.featuredPaths.length).toBeGreaterThanOrEqual(
      3,
    );
    expect(ARTICLE_LAYOUT.topPage.featuredPaths.length).toBeLessThanOrEqual(4);

    // config のパスはすべて publicArticleMetadata に存在する（存在しないパスはゲートも落とす）
    for (const path of ARTICLE_LAYOUT.topPage.featuredPaths) {
      expect(
        publicArticleMetadata.some((article) => article.path === path),
      ).toBe(true);
    }

    const section = topHtml().match(
      /<section\b[^>]*data-top-featured[^>]*>([\s\S]*?)<\/section\s*>/i,
    );
    expect(section).not.toBeNull();
    const hrefs = [...section![1].matchAll(/href="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(hrefs).toEqual(ARTICLE_LAYOUT.topPage.featuredPaths);
  });

  it("renders the FV search form submitting to /articles/?q=", () => {
    const form = topHtml().match(
      /<form\b[^>]*data-top-search[^>]*>([\s\S]*?)<\/form>/i,
    );
    expect(form).not.toBeNull();
    expect(topHtml()).toContain("data-top-search");
    expect(topHtml()).toMatch(
      /<form\b[^>]*data-top-search[^>]*action="\/articles\/"/i,
    );
    expect(form![1]).toMatch(/<input\b[^>]*name="q"/);
    expect(form![1]).toMatch(/<button\b[^>]*type="submit"/);
  });

  it("renders category entries for categories with >= categoryMinArticles articles", () => {
    const section = topHtml().match(
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
      ...articlesIndexHtml().matchAll(/<option value="([^"]+)">/g),
    ].map((match) => match[1]);
    for (const [name] of expectedCategories) {
      expect(optionCategories).toContain(name);
    }
  });

  it("uses one explicit article-index link after the featured section", () => {
    expect(topHtml()).toMatch(
      /<section\b[^>]*data-top-featured[^>]*>[\s\S]*?<\/section\s*>\s*<p class="meta wrap"><a href="\/articles\/">もっと見る →<\/a><\/p>/i,
    );
  });
});

describe.skipIf(!distRenderedHtmlAvailable)(
  "article card content types (rendered dist)",
  () => {
    // カード全体（class に article-list-card を含む <article> 要素）を列挙する。
    const cards = (html: string) =>
      [
        ...html.matchAll(
          /<article\b[^>]*class="[^"]*\barticle-list-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/g,
        ),
      ].map((match) => match[0]);

    it("tags every article card on the top page with its content type", () => {
      const tags = cards(topHtml());
      // 商品診断カード（/tools/ へのリンク）は記事ではないため対象外
      const articleCards = tags.filter(
        (card) => !card.includes('href="/tools/'),
      );
      expect(articleCards.length).toBeGreaterThan(0);
      for (const card of articleCards) {
        const match = card.match(/\bdata-content-type="(guide|comparison)"/);
        expect(match).not.toBeNull();
        // データ属性の値に対応するラベルタグが同じカード内に表示される
        const label =
          ARTICLE_LAYOUT.contentTypes[match![1] as "guide" | "comparison"]
            .label;
        expect(card).toContain(`>${label}</span>`);
      }
    });

    it("tags every article card in the articles index with its content type", () => {
      const tags = cards(articlesIndexHtml());
      expect(tags.length).toBeGreaterThan(0);
      for (const card of tags) {
        expect(card).toMatch(/\bdata-content-type="(guide|comparison)"/);
      }
    });

    it("renders every guide article card in the articles list with the guide label", () => {
      // 全ページ送りを含む記事一覧を結合し、ガイド記事が全て
      // data-content-type="guide" のカードとして表示されることを検証する。
      const listHtml = [
        articlesIndexHtml(),
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
      // 現行データではトップページの記事カードは全て比較記事（featured 4 件 +
      // 最新 6 件）なので、比較記事ラベルが描画される。
      const comparisonLabel = ARTICLE_LAYOUT.contentTypes.comparison.label;
      expect(topHtml()).toContain(`>${comparisonLabel}</span>`);
      for (const href of ARTICLE_LAYOUT.topPage.featuredPaths) {
        const article = articleMetadata.find((entry) => entry.path === href);
        expect(article).toBeDefined();
        expect(contentTypeFor(article!.productCount)).toBe("comparison");
      }
    });
  },
);

describe.skipIf(!distRenderedHtmlAvailable)(
  "article card thumbnails (rendered dist)",
  () => {
    const cards = (html: string) =>
      [
        ...html.matchAll(
          /<article\b[^>]*class="[^"]*\barticle-list-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/g,
        ),
      ].map((match) => match[0]);

    // describe 本体での即時読み取りは collection 時にも実行されるため、
    // cardPages は it 実行時に遅延構築する。
    const buildCardPages = (): ReadonlyArray<readonly [string, string]> => [
      ["dist/index.html", topHtml()],
      ["dist/articles/index.html", articlesIndexHtml()],
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
      const cardPages = buildCardPages();
      let total = 0;
      let image = 0;
      let tile = 0;
      for (const [page, html] of cardPages) {
        for (const card of cards(html)) {
          if (!isArticleCard(card)) continue;
          total += 1;
          const thumb = card.match(/\bdata-thumb="(image|tile)"/)?.[1];
          expect(thumb, `${page} card missing data-thumb`).toBeDefined();
          const hasImg = /<img\b[^>]*class="[^"]*\bcard-thumb\b[^"]*"/.test(
            card,
          );
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
      const cardPages = buildCardPages();
      for (const [, html] of cardPages) {
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
  },
);
