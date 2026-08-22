import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { site } from "../src/config/site";

// dist 依存テスト用のガード: astro build 済みの成果物が無い環境では該当テストを
// スキップする（astro build 後に実行されることを前提とした検証のため）。
const distRenderedHtmlAvailable = existsSync("dist/404.html");

describe("not-found output", () => {
  it("keeps Cloudflare configured to serve the generated 404 page", () => {
    const wrangler = JSON.parse(
      readFileSync("wrangler.jsonc", "utf8")
        .replace(/\/\/.*$/gm, "")
        .replace(/,\s*([}\]])/g, "$1"),
    ) as { assets?: { not_found_handling?: string } };

    expect(wrangler.assets?.not_found_handling).toBe("404-page");
  });

  // dist 未生成環境ではスキップ（レンダリング成果物の検証のため astro build 後に実行）
  it.skipIf(!distRenderedHtmlAvailable)(
    "renders the 404 page with non-indexable metadata and a recovery link",
    () => {
      const html = readFileSync("dist/404.html", "utf8");
      const expectedCanonical = new URL("/404/", `${site.url}/`).toString();

      expect(html).toContain('<meta name="robots" content="noindex,nofollow">');
      expect(html).toContain(
        `<link rel="canonical" href="${expectedCanonical}">`,
      );
      expect(html).toMatch(/<a\b[^>]*\bhref="\/"[^>]*>トップへ戻る<\/a>/);

      const jsonLd = html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
      )?.[1];
      expect(jsonLd).toBeDefined();

      const structuredData = JSON.parse(jsonLd ?? "{}") as Record<
        string,
        unknown
      >;
      expect(structuredData["@type"]).toBe("WebPage");
      expect(structuredData.url).toBe(expectedCanonical);
    },
  );
});
