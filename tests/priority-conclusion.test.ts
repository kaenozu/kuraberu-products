import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  pampersCandidateLabels,
  pampersPriorityOptions,
  pampersStandardConclusion,
} from "../src/content/pampers-priorities";
import {
  parsePriorityId,
  resolvePriorityConclusion,
} from "../src/lib/priority-conclusion";

describe("priority conclusion", () => {
  const resolve = (id?: string) =>
    resolvePriorityConclusion(
      id,
      pampersPriorityOptions,
      pampersCandidateLabels,
      pampersStandardConclusion,
    );
  it("returns standard for missing and unknown query values", () => {
    expect(resolve().outcome).toBe("standard");
    expect(
      parsePriorityId(
        new URLSearchParams("priority=unknown"),
        pampersPriorityOptions,
      ),
    ).toBeUndefined();
  });
  it("resolves left, right, tie and unknown without guessing", () => {
    expect(resolve("skin-care").outcome).toBe("left");
    expect(resolve("leak-fit").outcome).toBe("right");
    expect(resolve("newborn-size").outcome).toBe("tie");
    expect(resolve("price").outcome).toBe("unknown");
  });
  it("ignores affiliate data because it is outside the resolver contract", () => {
    const option = {
      ...pampersPriorityOptions[0],
      affiliateUrl: "https://example.invalid/high-commission",
    };
    const baseline = resolve("skin-care");
    const polluted = resolvePriorityConclusion(
      "skin-care",
      [option],
      pampersCandidateLabels,
      pampersStandardConclusion,
    );
    expect(polluted).toEqual(baseline);
  });
  it("renders the canonical comparison shell without JavaScript", () => {
    const html = readFileSync(
      "dist/articles/pampers-newborn/index.html",
      "utf8",
    );
    expect(html).toContain("5つの違い");
    expect(html).toContain("あなたはどちら向き？");
    expect(html).toContain("SNS での感想（参考情報）");
    expect(html).not.toContain("条件に応じた比較結論");
    expect(html).not.toContain("priority-conclusion.js");
    expect(html).not.toContain('<script type="module">');
    expect(html).toContain("key-differences");
    expect(html).toContain("decision-guide");
    expect(html).toContain("<noscript>");
  });
});
