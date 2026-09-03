import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { commercialArticleSeeds } from "../src/content/articles/commercial";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("commercial article publishedAt contract (#601)", () => {
  it("requires an explicit valid publication date on every commercial seed", () => {
    expect(commercialArticleSeeds.length).toBeGreaterThan(0);

    for (const seed of commercialArticleSeeds) {
      expect(seed.publishedAt, seed.id).toMatch(ISO_DATE);
      if (seed.modifiedAt) {
        expect(seed.modifiedAt >= seed.publishedAt, seed.id).toBe(true);
      }
    }
  });

  it("does not silently fall back to a fixed publication date", () => {
    const createSource = readFileSync(
      new URL(
        "../src/content/articles/commercial/create.ts",
        import.meta.url,
      ),
      "utf8",
    );

    expect(createSource).toContain("publishedAt: seed.publishedAt,");
    expect(createSource).not.toContain("seed.publishedAt ??");
  });
});
