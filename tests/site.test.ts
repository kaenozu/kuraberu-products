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

  it("keeps article discovery and keyboard entry contracts", () => {
    const sitemap = readFileSync("src/pages/sitemap.xml.ts", "utf8");
    const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
    expect(sitemap).toContain("articleMetadata");
    expect(sitemap).toContain("article.path");
    expect(layout).toContain('href="#main-content"');
    expect(layout).toContain('id="main-content"');
    expect(layout).toContain("aria-current");
  });
});
