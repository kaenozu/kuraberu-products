import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MAX_POST_LENGTH,
  buildDraft,
  generateAnnouncements,
  parseArticles,
} from "../scripts/generate-x-announcements.mjs";

const fixture = `
export const alphaArticle = defineArticleMetadata({
  id: "alpha-vs-beta",
  productCount: 2,
  path: "/articles/alpha-vs-beta/",
  title: "サンプル AとB、どっち？｜くらべる商品メモ",
  headline: "サンプルAとBを、公式仕様で比較",
  description: "説明",
  category: "生活家電",
  tags: ["除湿機", "パナソニック"],
  audiences: ["選びたい人"],
  uses: ["比較する"],
  summary: "公式の数値で比較します。",
  publishedAt: "2026-08-15",
  modifiedAt: "2026-08-15",
  productInfoCheckedAt: "2026-08-15",
  purchaseLinksCheckedAt: "2026-08-15",
  purchaseLinkStatus: "verified",
  imagePath: "/products/alpha.jpg",
  changeLog: [
    {
      date: "2026-08-15",
      summary: "初回公開。公式仕様ページで数値を確認。",
    },
  ],
});
`;

describe("parseArticles", () => {
  it("extracts metadata fields from articles.ts source", () => {
    const articles = parseArticles(fixture);
    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      id: "alpha-vs-beta",
      title: "サンプル AとB、どっち？｜くらべる商品メモ",
      headline: "サンプルAとBを、公式仕様で比較",
      path: "/articles/alpha-vs-beta/",
      publishedAt: "2026-08-15",
      category: "生活家電",
      tags: ["除湿機", "パナソニック"],
    });
  });

  it("parses every article in the real articles.ts", () => {
    const source = readFileSync("src/content/articles.ts", "utf8");
    const articles = parseArticles(source);
    expect(articles.length).toBeGreaterThan(0);
    for (const article of articles) {
      expect(article.id).toBeTruthy();
      expect(article.title).toBeTruthy();
      expect(article.path).toMatch(/^\/articles\/.+\/$/);
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("buildDraft", () => {
  it("keeps the draft within the X post limit", () => {
    const [article] = parseArticles(fixture);
    const draft = buildDraft(article, "https://kuraberu-products.pages.dev");
    expect(draft.length).toBeLessThanOrEqual(MAX_POST_LENGTH);
    expect(draft).toContain("【記事公開】");
    expect(draft).toContain(
      "https://kuraberu-products.pages.dev/articles/alpha-vs-beta/",
    );
    expect(draft).toContain("#除湿機");
  });

  it("truncates an overly long headline without breaking the URL", () => {
    const [article] = parseArticles(fixture);
    const longArticle = {
      ...article,
      headline: "あ".repeat(400),
    };
    const draft = buildDraft(longArticle, "https://example.com");
    expect(draft.length).toBeLessThanOrEqual(MAX_POST_LENGTH);
    expect(draft).toContain("https://example.com/articles/alpha-vs-beta/");
  });

  it("produces drafts under the limit for every real article", () => {
    const source = readFileSync("src/content/articles.ts", "utf8");
    for (const article of parseArticles(source)) {
      const draft = buildDraft(article, "https://kuraberu-products.pages.dev");
      expect(
        draft.length,
        `${article.id}: draft exceeds ${MAX_POST_LENGTH} chars`,
      ).toBeLessThanOrEqual(MAX_POST_LENGTH);
    }
  });
});

describe("generateAnnouncements", () => {
  it("announces only articles added since the previous version", () => {
    const current = `${fixture}
export const betaArticle = defineArticleMetadata({
  id: "beta-vs-gamma",
  productCount: 2,
  path: "/articles/beta-vs-gamma/",
  title: "サンプル CとD、どっち？｜くらべる商品メモ",
  headline: "サンプルCとDを比較",
  description: "説明",
  category: "キッチン",
  tags: ["ポット"],
  audiences: ["選びたい人"],
  uses: ["比較する"],
  summary: "公式の数値で比較します。",
  publishedAt: "2026-08-16",
  modifiedAt: "2026-08-16",
  productInfoCheckedAt: "2026-08-16",
  purchaseLinksCheckedAt: "2026-08-16",
  purchaseLinkStatus: "verified",
  changeLog: [
    {
      date: "2026-08-16",
      summary: "初回公開。公式仕様ページで数値を確認。",
    },
  ],
});
`;
    const announcements = generateAnnouncements(
      current,
      fixture,
      "https://example.com",
    );
    expect(announcements.map((entry) => entry.article.id)).toEqual([
      "beta-vs-gamma",
    ]);
    expect(announcements[0].draft).toContain("beta-vs-gamma");
  });

  it("returns nothing when no article was added", () => {
    const announcements = generateAnnouncements(
      fixture,
      fixture,
      "https://example.com",
    );
    expect(announcements).toEqual([]);
  });
});
