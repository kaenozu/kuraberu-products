import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  dependencies?: Record<string, string>;
  pnpm?: { overrides?: Record<string, string> };
};

describe("release dependency contract", () => {
  it("declares cookie directly so generated prerender imports are deterministic", () => {
    expect(packageJson.dependencies?.cookie).toBe("2.0.1");
  });

  it("pins sharp to a patched production version", () => {
    const sharp = packageJson.pnpm?.overrides?.sharp;
    expect(sharp).toMatch(/^0\.35\./);
  });
});
