import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { articleMetadata } from "../src/content/articles";
import {
  comparisonMemoLimit,
  encodeComparisonMemo,
  sanitizeComparisonMemo,
  toggleComparisonMemo,
} from "../src/lib/comparison-memo";

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
  it("renders memo controls while keeping article links without JavaScript", () => {
    const articleHtml = readFileSync(
      "dist/articles/pampers-newborn/index.html",
      "utf8",
    );
    const memoHtml = readFileSync("dist/memo/index.html", "utf8");
    expect(articleHtml).toContain("比較メモに保存");
    expect(memoHtml).toContain("このブラウザの端末内だけ");
    expect(memoHtml).toContain(articleMetadata[0].path);
    expect(memoHtml).toContain("<noscript>");
  });
});
