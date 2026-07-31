import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Issue #2 editorial comparison UI", () => {
  it("keeps both products identifiable on the homepage card", () => {
    const homepage = read("src/pages/index.astro");
    expect(homepage).toContain("肌へのいちばん");
    expect(homepage).toContain("さらさらケア");
    expect(homepage).toContain("product-pair");
    expect(homepage).toContain("/articles/pampers-newborn/");
  });

  it("uses the three issue-specific comparison components in the article", () => {
    const article = read("src/pages/articles/pampers-newborn/index.astro");
    expect(article).toContain("ThirtySecondComparison");
    expect(article).toContain("DifferenceList");
    expect(article).toContain('id="comparison-details"');

    const status = read("src/components/VerificationStatus.astro");
    expect(status).toContain("公式確認済み");
    expect(status).toContain("販売ページ確認");
    expect(status).toContain("口コミ不足");
    expect(status).toContain("未確認");
  });
});
