import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { articleMetadata } from "../src/content/articles";
import {
  comparisonMemoLimit,
  encodeComparisonMemo,
  sanitizeComparisonMemo,
  toggleComparisonMemo,
} from "../src/lib/comparison-memo";

// dist 依存テスト用のガード: astro build 済みの成果物が無い環境
// （unit-only の CI ジョブ等）では該当テストをスキップする。
const distRenderedHtmlAvailable =
  existsSync("dist/memo/index.html") &&
  existsSync("dist/articles/pampers-newborn/index.html");

describe("comparison memo", () => {
  const knownIds = articleMetadata.map((article) => article.id);
  it("recovers corrupt, obsolete and duplicate data safely", () => {
    expect(sanitizeComparisonMemo("not-json", knownIds).ids).toEqual([]);
    expect(
      sanitizeComparisonMemo(
        JSON.stringify({ version: 9, ids: knownIds }),
        knownIds,
      ).ids,
    ).toEqual([]);
    expect(
      sanitizeComparisonMemo(
        JSON.stringify({
          version: 1,
          ids: [knownIds[0], knownIds[0], "removed"],
        }),
        knownIds,
      ).ids,
    ).toEqual([knownIds[0]]);
  });
  it("toggles without duplicates and enforces the limit", () => {
    const added = toggleComparisonMemo({ version: 1, ids: [] }, knownIds[0]);
    expect(added.added).toBe(true);
    expect(toggleComparisonMemo(added.state, knownIds[0]).state.ids).toEqual(
      [],
    );
    const full = {
      version: 1 as const,
      ids: Array.from(
        { length: comparisonMemoLimit },
        (_, index) => "id-" + index,
      ),
    };
    expect(toggleComparisonMemo(full, "another").atLimit).toBe(true);
  });
  it("stores only version and article ids", () => {
    expect(encodeComparisonMemo([knownIds[0]])).toBe(
      JSON.stringify({ version: 1, ids: [knownIds[0]] }),
    );
  });
});

describe.skipIf(!distRenderedHtmlAvailable)(
  "comparison memo rendered HTML (dist)",
  () => {
    it("renders memo controls while keeping article links without JavaScript", () => {
      const articleHtml = readFileSync(
        "dist/articles/pampers-newborn/index.html",
        "utf8",
      );
      const memoHtml = readFileSync("dist/memo/index.html", "utf8");
      expect(articleHtml).toContain("比較メモに保存");
      expect(memoHtml).toContain("このブラウザの端末内だけ");
      expect(memoHtml).toContain("比較の目的・利用シーン");
      expect(memoHtml).toContain("Must-have（絶対条件）");
      expect(memoHtml).toContain("決定理由");
      expect(memoHtml).toContain(articleMetadata[0].path);
      expect(memoHtml).toContain("<noscript>");
    });
  },
);

describe("memo page focus retention (source contract)", () => {
  const memoSource = readFileSync("src/pages/memo.astro", "utf8");

  it("moves focus to the next item after removal instead of dropping it", () => {
    expect(memoSource).toContain("moveFocusAfterRemoval");
    expect(memoSource).toContain("nextItem.tabIndex = -1");
    expect(memoSource).toContain("nextItem.focus()");
  });

  it("falls back to the previous item, then the section heading", () => {
    // 削除対象が末尾の場合は前の項目、リストが空になった場合は見出しへ
    expect(memoSource).toContain("ids[ids.length - 1]");
    expect(memoSource).toContain(
      'root.querySelector("#saved-articles-heading")',
    );
    expect(memoSource).toContain("sectionHeading.focus()");
  });
});
