import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("generated sitemap", () => {
  it("contains public pages and excludes browser-only memo pages", () => {
    const sitemap = readFileSync("dist/sitemap.xml", "utf8");
    const origin = (
      process.env.PUBLIC_SITE_URL ?? "https://kuraberu-products.pages.dev"
    ).replace(/\/$/, "");
    for (const pathname of [
      "/",
      "/articles/",
      "/articles/pampers-newborn/",
      "/about/",
      "/privacy/",
      "/disclaimer/",
    ]) {
      expect(sitemap).toContain(`<loc>${origin}${pathname}</loc>`);
    }
    expect(sitemap).not.toContain("/memo/");
    expect(sitemap).not.toContain("/404");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    );
    expect(new Set(urls).size).toBe(urls.length);
  });
});
