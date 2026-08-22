import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// 実ビルド（astro build）後の dist/articles を検証する。dist が無い環境では
// 理由をログに出して明示的にスキップする。
const hasDist = existsSync("dist");
if (!hasDist) {
  console.warn(
    "skip: dist/ が存在しないため official-link-separation の実ビルド整合テストをスキップしました（astro build 後に再実行してください）",
  );
}

const articlesDir = join(process.cwd(), "dist", "articles");

function articleHtmlFiles() {
  return readdirSync(articlesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !"page category".includes(entry.name))
    .map((entry) => join(articlesDir, entry.name, "index.html"));
}

describe.skipIf(!hasDist)("official and purchase links stay separate", () => {
  it("never renders a Rakuten short URL as the hero official link", () => {
    for (const file of articleHtmlFiles()) {
      const html = readFileSync(file, "utf8");
      const heroLinks = html.match(/<a class="hero-official"[^>]*>/g) ?? [];
      expect(heroLinks, file).not.toEqual(
        expect.arrayContaining([expect.stringContaining("a.r10.to")]),
      );
    }
  });

  it("labels Rakuten links in source lists as purchase or price references", () => {
    for (const file of articleHtmlFiles()) {
      const html = readFileSync(file, "utf8");
      const sourceLists =
        html.match(/<ul class="source-list"[\s\S]*?<\/ul>/g) ?? [];
      for (const sourceList of sourceLists) {
        const rakutenLinks =
          sourceList.match(
            /<a href="https:\/\/a\.r10\.to\/[^"]+"[^>]*>[^<]*<\/a>/g,
          ) ?? [];
        for (const link of rakutenLinks) {
          expect(link, `${file}: ${link}`).toMatch(/楽天市場|購入|価格|在庫/);
        }
      }
    }
  });
});
