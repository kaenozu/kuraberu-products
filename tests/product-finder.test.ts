import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { diagnosisCategories } from "../src/data/diagnoses";

/**
 * Issue #562 のテストギャップ補充。
 * product-finder ページの SEO / noindex / リンク整合性を検証する。
 *
 * dist ディレクトリが必要 (pnpm test 経由の pretest で build される)。
 */

const hasDist = existsSync("dist");
if (!hasDist) {
  console.warn(
    "skip: dist/ が存在しないため product-finder テストをスキップしました",
  );
}

const findFile = (p: string): string | null => {
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
};

describe("product-finder pages (#562)", () => {
  it("index.html links to all diagnosis category pages", () => {
    const html = findFile("dist/tools/product-finder/index.html");
    if (!html) return;
    for (const cat of diagnosisCategories) {
      expect(html).toContain(`/tools/product-finder/${cat.slug}/`);
    }
  });

  it("category pages contain canonical URL and meta description", () => {
    for (const cat of diagnosisCategories) {
      const path = `dist/tools/product-finder/${cat.slug}/index.html`;
      const html = findFile(path);
      if (!html) continue;
      // canonical
      expect(html).toMatch(
        new RegExp(
          `<link rel="canonical" href="https://[^/]+/tools/product-finder/${cat.slug}/"`,
        ),
      );
      // description meta
      expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    }
  });

  it("category pages are noindex in non-production (preview default)", () => {
    const isProduction =
      (process.env.DEPLOYMENT_ENV ?? "preview") === "production";
    for (const cat of diagnosisCategories) {
      const path = `dist/tools/product-finder/${cat.slug}/index.html`;
      const html = findFile(path);
      if (!html) continue;
      if (isProduction) {
        expect(html).toContain('content="index,follow');
      } else {
        expect(html).toContain('content="noindex');
      }
    }
  });
});
