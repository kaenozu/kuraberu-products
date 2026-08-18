import { describe, expect, it } from "vitest";
import {
  checkCssSource,
  checkRadiusTokens,
  isAllowedBorderRadius,
} from "../scripts/check-radius-tokens.mjs";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("radius token audit", () => {
  it("accepts the three tier variables", () => {
    expect(isAllowedBorderRadius("var(--radius-sm)")).toBe(true);
    expect(isAllowedBorderRadius("var(--radius-md)")).toBe(true);
    expect(isAllowedBorderRadius("var(--radius-lg)")).toBe(true);
  });

  it("accepts full-round shapes (50% and 999px) as non-tier shapes", () => {
    expect(isAllowedBorderRadius("50%")).toBe(true);
    expect(isAllowedBorderRadius("999px")).toBe(true);
  });

  it("accepts asymmetric radius built from 0 and tier variables", () => {
    expect(isAllowedBorderRadius("0 var(--radius-md) var(--radius-md) 0")).toBe(
      true,
    );
    expect(isAllowedBorderRadius("var(--radius-md) var(--radius-sm)")).toBe(
      true,
    );
  });

  it("rejects raw pixel values", () => {
    for (const value of ["4px", "6px", "8px", "10px", "12px", "14px"]) {
      expect(isAllowedBorderRadius(value), value).toBe(false);
    }
  });

  it("rejects mixed raw pixels inside an asymmetric radius", () => {
    expect(isAllowedBorderRadius("0 10px 10px 0")).toBe(false);
  });

  it("flags raw pixels in a CSS source with file context", () => {
    const errors: string[] = [];
    checkCssSource(
      ".card { border-radius: 8px; } .pill { border-radius: 999px; }",
      "global.css",
      errors,
    );
    expect(errors).toEqual([
      'global.css: border-radius "8px" is not one of the 3 radius tokens (--radius-sm/md/lg); use var(--radius-…) instead (or keep 50%/999px for full-round shapes)',
    ]);
  });

  it("flags raw pixels inside astro style blocks", () => {
    const directory = mkdtempSync(join(tmpdir(), "radius-tokens-"));
    try {
      mkdirSync(join(directory, "components"), { recursive: true });
      writeFileSync(
        join(directory, "components", "Card.astro"),
        `---\nconst x = 1;\n---\n<div class="card"></div>\n<style>\n  .card {\n    border-radius: 12px;\n  }\n</style>`,
      );
      mkdirSync(join(directory, "styles"), { recursive: true });
      writeFileSync(
        join(directory, "styles", "global.css"),
        ".ok { border-radius: var(--radius-lg); }",
      );
      const errors = checkRadiusTokens({ srcDirectory: directory });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("components/Card.astro");
      expect(errors[0]).toContain('border-radius "12px"');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("passes a source that only uses tier variables", () => {
    const errors: string[] = [];
    checkCssSource(
      ".a { border-radius: var(--radius-sm); } .b { border-radius: 50%; } .c { border-radius: 0 var(--radius-md) var(--radius-md) 0; }",
      "global.css",
      errors,
    );
    expect(errors).toEqual([]);
  });
});
