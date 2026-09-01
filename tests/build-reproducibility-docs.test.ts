import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const docs = readFileSync("docs/build-reproducibility.md", "utf8");

describe("build reproducibility documentation", () => {
  it("documents the deterministic input boundary and affiliate fallback behavior", () => {
    expect(docs).toContain("pnpm install --frozen-lockfile");
    expect(docs).toContain("PUBLIC_RAKUTEN_PREMIUM_URL");
    expect(docs).toContain("PUBLIC_RAKUTEN_SARASARA_URL");
    expect(docs).toContain("RAKUTEN_APPLICATION_ID");
    expect(docs).toContain("API 取得に失敗");
    expect(docs).toContain("未確認値を補完しない");
    expect(docs).toContain("PUBLIC_BUILD_SHA");
  });
});
