import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  extractBuildSha,
  validateGeneratedBuildSha,
} from "../scripts/check-build-sha.mjs";
import {
  normalizeOptionalBuildSha,
  validateBuildEnvironment,
} from "../config/runtime-env.mjs";

const validSha = "0123456789abcdef0123456789abcdef01234567";
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function fixture(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "kuraberu-build-sha-"));
  temporaryDirectories.push(root);
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = join(root, relativePath);
    mkdirSync(join(filePath, ".."), { recursive: true });
    writeFileSync(filePath, content, "utf8");
  }
  return root;
}

describe("public build SHA", () => {
  it("normalizes exact SHA and rejects ambiguous values", () => {
    expect(normalizeOptionalBuildSha(validSha.toUpperCase())).toBe(validSha);
    expect(normalizeOptionalBuildSha(undefined)).toBeUndefined();
    expect(() => normalizeOptionalBuildSha("abc")).toThrow(/40-character/);
  });

  it("requires the SHA for production but not preview", () => {
    expect(
      validateBuildEnvironment({ DEPLOYMENT_ENV: "preview" }).buildSha,
    ).toBeUndefined();
    expect(() =>
      validateBuildEnvironment({
        DEPLOYMENT_ENV: "production",
        PUBLIC_SITE_URL: "https://example.invalid",
        PUBLIC_RAKUTEN_PREMIUM_URL:
          "https://hb.afl.rakuten.co.jp/example/premium",
        PUBLIC_RAKUTEN_SARASARA_URL:
          "https://hb.afl.rakuten.co.jp/example/sarasara",
      }),
    ).toThrow(/PUBLIC_BUILD_SHA/);
  });

  it("extracts a marker and validates every generated page", () => {
    const marker = `<meta name="x-build-sha" content="${validSha}" />`;
    const root = fixture({
      "index.html": `<head>${marker}</head>`,
      "articles/index.html": `<head>${marker}</head>`,
    });
    expect(extractBuildSha(marker)).toBe(validSha);
    expect(
      validateGeneratedBuildSha({ distDirectory: root, expectedSha: validSha }),
    ).toEqual({
      pageCount: 2,
      expectedSha: validSha,
      errors: [],
    });
  });

  it("reports missing and stale markers", () => {
    const root = fixture({
      "index.html": "<head></head>",
      "about/index.html": `<meta name="x-build-sha" content="${"f".repeat(40)}" />`,
    });
    const result = validateGeneratedBuildSha({
      distDirectory: root,
      expectedSha: validSha,
    });
    expect(result.errors).toHaveLength(2);
    expect(result.errors.join("\n")).toContain("actual=undefined");
  });
});
