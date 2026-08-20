import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  publicArticleMetadata,
  pampersNewbornArticle,
} from "../src/content/articles";
import {
  discoverySearchParams,
  matchesArticle,
  normalizeDiscoveryText,
  parseDiscoveryState,
} from "../src/lib/article-discovery";

describe("article discovery", () => {
  it("normalizes width, case and whitespace", () => {
    expect(normalizeDiscoveryText("  ＰＡＭＰＥＲＳ   新生児 ")).toBe(
      "pampers 新生児",
    );
  });
  it("matches typed metadata across query, category and tag", () => {
    expect(
      matchesArticle(pampersNewbornArticle, {
        query: "パンパース 新生児",
        category: "育児用品",
        tag: "紙おむつ",
      }),
    ).toBe(true);
    expect(matchesArticle(pampersNewbornArticle, { query: "飲料" })).toBe(
      false,
    );
  });
  it("matches model numbers that appear only in the subjects line", () => {
    // 型番が headline に登場しない記事（例: 日立 BD-SX130K vs BD-STX130K）でも、
    // card-subjects 行（comparisonSubjects 由来）が検索対象になること。
    const article = {
      ...pampersNewbornArticle,
      id: "hitachi-bd-sx130k-vs-bd-stx130k",
      title: "日立 BD-SX130K と BD-STX130K、どっち？｜くらべる商品メモ",
      headline: "日立のドラム式洗濯乾燥機を比較。操作パネル・温水・乾燥で選ぶ",
      aboutProductNames: ["日立 BD-SX130K", "日立 BD-STX130K"],
    };
    expect(matchesArticle(article, { query: "BD-SX130K" })).toBe(true);
    expect(matchesArticle(article, { query: "BD-STX130K" })).toBe(true);
  });
  it("ignores unknown query parameters and serializes known state", () => {
    const parsed = parseDiscoveryState(
      new URLSearchParams("q=新生児&category=unknown&tag=紙おむつ"),
      ["育児用品"],
      ["紙おむつ"],
    );
    expect(parsed).toEqual({
      query: "新生児",
      category: undefined,
      tag: "紙おむつ",
    });
    expect(discoverySearchParams(parsed).toString()).toBe(
      "q=%E6%96%B0%E7%94%9F%E5%85%90&tag=%E7%B4%99%E3%81%8A%E3%82%80%E3%81%A4",
    );
  });
  it("renders paginated article lists before JavaScript and exposes accessible filters", () => {
    const pageFiles = [
      "dist/articles/index.html",
      "dist/articles/page/2/index.html",
      "dist/articles/page/3/index.html",
    ];
    const html = pageFiles.map((file) => readFileSync(file, "utf8")).join("\n");
    const firstPage = readFileSync("dist/articles/index.html", "utf8");
    expect(html).toContain('role="search"');
    expect(html).toContain("data-article-card");
    expect(html).toContain(pampersNewbornArticle.path);
    expect(html).toContain("条件に合う記事がありません");
    expect(html).toContain("紙おむつ");
    expect(html).toContain(
      '<script src="/scripts/article-discovery.js" defer></script>',
    );
    expect(html).not.toContain("data-discovery-form]");
    expect(
      (firstPage.match(/data-article-card/g) ?? []).length,
    ).toBeLessThanOrEqual(12);
  });

  it("SSR count and discovery index both reflect total articles, not page-1 card count", () => {
    const firstPage = readFileSync("dist/articles/index.html", "utf8");

    // SSR count element: <p ... data-discovery-count>{N}件の記事</p>
    const countMatch = firstPage.match(
      /data-discovery-count[^>]*>(\d+)件の記事/,
    );
    expect(countMatch).not.toBeNull();
    const ssrCount = Number(countMatch?.[1]);

    // The discovery index JSON contains ALL public articles (not just page 1).
    const indexMatch = firstPage.match(
      /<script[^>]*data-discovery-index[^>]*>([\s\S]*?)<\/script>/,
    );
    expect(indexMatch).not.toBeNull();
    const indexArticles = JSON.parse(indexMatch?.[1] ?? "[]");

    // Both must equal the full publicArticleMetadata length,
    // which is strictly greater than the 12-per-page card limit.
    expect(ssrCount).toBe(publicArticleMetadata.length);
    expect(indexArticles.length).toBe(publicArticleMetadata.length);
    expect(publicArticleMetadata.length).toBeGreaterThan(12);

    // The DOM card count on page 1 must be capped at 12,
    // confirming SSR does NOT render all articles inline.
    const cardCount = (firstPage.match(/data-article-card/g) ?? []).length;
    expect(cardCount).toBeLessThanOrEqual(12);
    expect(cardCount).toBeLessThan(publicArticleMetadata.length);
  });
});
