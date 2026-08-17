import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const articlesDir = join(process.cwd(), "dist", "articles");

function articleHtmlFiles() {
  return readdirSync(articlesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => entry.name !== "page")
    .map((entry) => join(articlesDir, entry.name, "index.html"));
}

describe("official and purchase links stay separate", () => {
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
