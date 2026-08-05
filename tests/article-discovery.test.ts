import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pampersNewbornArticle } from "../src/content/articles";
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
  it("renders every article before JavaScript and exposes accessible filters", () => {
    const html = readFileSync("dist/articles/index.html", "utf8");
    expect(html).toContain('role="search"');
    expect(html).toContain("data-article-card");
    expect(html).toContain(pampersNewbornArticle.path);
    expect(html).toContain("条件に合う記事がありません");
    expect(html).toContain("紙おむつ");
  });
});
