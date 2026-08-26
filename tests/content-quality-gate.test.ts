import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const articlesDir = join(root, "src/content/articles");
const excludeFiles = new Set(["index.ts", "commercial.ts", "types.ts"]);
const articleSource = readdirSync(articlesDir)
  .filter((f) => f.endsWith(".ts") && !excludeFiles.has(f))
  .map((f) => readFileSync(join(articlesDir, f), "utf8"))
  .join("\n");
const articlePages = readdirSync(join(root, "src/pages/articles"), {
  recursive: true,
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name === "index.astro")
  .map((entry) => join(entry.parentPath, entry.name));

function purchaseCardBlocks(source: string): string[] {
  return [...source.matchAll(/<PurchaseCard\b[\s\S]*?\/>/g)].map(
    ([block]) => block,
  );
}

describe("公開記事コンテンツ品質ゲート", () => {
  it("記事データへコード片や未展開の簡体字が混入しない", () => {
    expect(articleSource).not.toMatch(/\.setBackgroundResource|\bundefined\b/);
    expect(articleSource).not.toContain("毛络まり");
  });

  it("Astro式の文字列リテラルを記事ページへ残さない", () => {
    for (const pagePath of articlePages) {
      const pageSource = readFileSync(pagePath, "utf8");
      expect(pageSource, pagePath).not.toMatch(
        /["']\{articleMetadata\.productInfoCheckedAt\}/,
      );
    }
  });

  // 購入CTAの fail-closed 契約:
  // - PurchaseCard は purchaseLinkStatus === "verified" のときだけ CTA を出す。
  //   未指定（undefined）は「確認中」扱いで pending 文言になるため、検証済み記事が
  //   status の受け渡しを忘れると CTA が消える。全ブロックでの明示を必須にする。
  // - unverified / unavailable ページはアフィリエイトCTA 0枚 + pending 文言が
  //   正しい期待値（scripts/check-rendered-html.mjs が dist に対して同じ契約を照合する）。
  it("全PurchaseCardブロックがpurchaseLinkStatusを明示する", () => {
    const templateSources = [
      join(root, "src/components/ArticleComparisonPage.astro"),
      join(root, "src/components/CommercialArticlePage.astro"),
      ...articlePages,
    ];
    for (const sourcePath of templateSources) {
      const source = readFileSync(sourcePath, "utf8");
      for (const block of purchaseCardBlocks(source)) {
        expect(
          block,
          `${sourcePath}: PurchaseCard must pass purchaseLinkStatus explicitly (fail-closed contract)`,
        ).toMatch(/\bpurchaseLinkStatus=/);
      }
    }
  });

  it("PurchaseCardコンポーネントがfail-closed実装であること", () => {
    const componentSource = readFileSync(
      join(root, "src/components/PurchaseCard.astro"),
      "utf8",
    );
    expect(componentSource).toMatch(
      /isVerified\s*=\s*purchaseLinkStatus\s*===\s*["']verified["']/,
    );
    // 旧fail-open実装（undefined を verified 扱いにする OR 節）の再混入を禁止
    expect(componentSource).not.toMatch(
      /purchaseLinkStatus\s*!==?\s*["'](?:unverified|unavailable)["']\s*&&/,
    );
    expect(componentSource).not.toMatch(/===\s*["']verified["']\s*\|\|/);
  });
});
