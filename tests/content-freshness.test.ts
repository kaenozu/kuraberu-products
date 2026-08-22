import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pampersNewbornArticle } from "../src/content/articles";
import { daysSinceCheck, isContentStale } from "../src/lib/content-freshness";

// dist 依存テスト用のガード: astro build 済みの成果物が無い環境では該当テストを
// スキップする（astro build 後に実行されることを前提とした検証のため）。
const distRenderedHtmlAvailable =
  existsSync("dist/articles") &&
  existsSync("dist/articles/pampers-newborn/index.html");

describe("content freshness", () => {
  it("uses calendar dates without negative ages", () => {
    expect(daysSinceCheck("2026-07-31", "2026-08-05")).toBe(5);
    expect(daysSinceCheck("2026-08-05", "2026-07-31")).toBe(0);
  });

  it("treats missing and old checks as stale", () => {
    expect(isContentStale(undefined, "2026-08-05")).toBe(true);
    expect(isContentStale("2026-01-01", "2026-08-05", 180)).toBe(true);
    expect(isContentStale("2026-07-31", "2026-08-05", 180)).toBe(false);
  });

  it("keeps product-info and purchase-link check dates separate", () => {
    expect(pampersNewbornArticle.productInfoCheckedAt).toBe("2026-07-31");
    expect(pampersNewbornArticle.purchaseLinkStatus).toBe("verified");
    expect(pampersNewbornArticle.purchaseLinksCheckedAt).toBe("2026-08-16");
  });

  // dist 未生成環境ではスキップ（レンダリング成果物の検証のため astro build 後に実行）
  it.skipIf(!distRenderedHtmlAvailable)(
    "renders factual check dates and update history",
    () => {
      const html = readFileSync(
        "dist/articles/pampers-newborn/index.html",
        "utf8",
      );
      // v3 短縮で verification-summary（商品情報確認日）は廃止。
      // 確認日は冒頭の TrustLine（✓ 公式確認済み（日付）・広告を含みます）と
      // 情報源一覧で表示する。
      expect(html).toContain("✓ 公式確認済み（2026-07-31）・広告を含みます");
      expect(html).toContain('datetime="2026-07-31"');
      expect(html).toContain("2026-07-31確認");
      expect(html).not.toContain("最終確認日は未記録");
      expect(html).not.toContain("購入リンク：未確認");
      expect(html).toContain("更新履歴");
      expect(html).toContain("メーカー公式の商品機能とサイズ情報を確認");
      expect(html).toContain("価格や在庫を保証しません");
    },
  );

  // dist 未生成環境ではスキップ（レンダリング成果物の検証のため astro build 後に実行）
  it.skipIf(!distRenderedHtmlAvailable)(
    "does not leak bottle-only specs into other article pages",
    () => {
      const articlesDir = "dist/articles";
      const articleDirs = readdirSync(articlesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => !"page category".includes(entry.name))
        .map((entry) => entry.name);
      const bottleOnlyTerms = ["容量0.5L", "保温効力68℃以上"];

      for (const slug of articleDirs) {
        const html = readFileSync(
          join(articlesDir, slug, "index.html"),
          "utf8",
        );
        if (["thermos-tiger-bottle", "tiger-mta-j050-guide"].includes(slug))
          continue;
        for (const term of bottleOnlyTerms) {
          expect(html, `${slug} contains ${term}`).not.toContain(term);
        }
      }
    },
  );
});
