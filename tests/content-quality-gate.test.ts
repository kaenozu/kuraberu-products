import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const articleSource = readFileSync(
  join(root, "src/content/articles.ts"),
  "utf8",
);
const articlePages = readdirSync(join(root, "src/pages/articles"), {
  recursive: true,
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name === "index.astro")
  .map((entry) => join(entry.parentPath, entry.name));

describe("公開記事コンテンツ品質ゲート", () => {
  it("記事データへコード片や未展開の簡体字が混入しない", () => {
    expect(articleSource).not.toMatch(/\.setBackgroundResource|\bundefined\b/);
    expect(articleSource).not.toContain("毛络まり");
  });

  it("Astro式の文字列リテラルを記事ページへ残さない", () => {
    for (const pagePath of articlePages) {
      const pageSource = readFileSync(pagePath, "utf8");
      expect(pageSource, pagePath).not.toMatch(
        /["']\{articleMetadata\.productInfoCheckedAt\}/,
      );
    }
  });
});
