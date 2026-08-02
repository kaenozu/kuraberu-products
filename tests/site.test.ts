import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_URL, site } from "../src/config/site";

describe("site config", () => {
  it("uses the current public domain as the only fallback", () => {
    expect(DEFAULT_SITE_URL).toBe("https://kuraberu-products.pages.dev");
    expect(site.url).toMatch(/^https:\/\//);
    expect(readFileSync("astro.config.mjs", "utf8")).not.toContain(
      "kuraberu-ikuji.pages.dev",
    );
  });

  it("keeps preview and production indexing explicit", () => {
    const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
    expect(layout).toContain("DEPLOYMENT_ENV");
    expect(layout).toContain("index,follow");
    expect(layout).toContain("noindex,nofollow");
  });

  it("keeps the Workers 404 and not-found metadata contracts explicit", () => {
    const wrangler = JSON.parse(
      readFileSync("wrangler.jsonc", "utf8")
        .replace(/\/\/.*$/gm, "")
        .replace(/,\s*([}\]])/g, "$1"),
    );
    const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
    const notFoundPage = readFileSync("src/pages/404.astro", "utf8");

    expect(wrangler.assets.not_found_handling).toBe("404-page");
    expect(layout).toContain(
      "type RobotsDirective = 'index,follow' | 'noindex,nofollow'",
    );
    expect(layout).toContain("type PageKind = 'default' | 'not-found'");
    expect(layout).toContain(
      "const robotsContent = isNotFound ? 'noindex,nofollow'",
    );
    expect(layout).toContain("const resolvedOgType = isNotFound ? 'website'");
    expect(notFoundPage).toContain('pageKind="not-found"');
    expect(notFoundPage).toContain("ページが見つかりません");
    expect(notFoundPage).toContain('href="/"');
    expect(notFoundPage).not.toContain('robots="index,follow"');
  });
});
