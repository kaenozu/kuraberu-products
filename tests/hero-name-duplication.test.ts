import { describe, expect, it } from "vitest";
import { heroNameDuplicationViolations } from "../scripts/validate-hero-names.mjs";

function sourceWith(product: string, line: string, offset = 2): string {
  const lines = [
    "const candidate: ComparisonCandidate = {",
    `  product: '${product}',`,
    `  line: '${line}',`,
    "  tone: 'standard',",
    "  status: 'official',",
    "};",
  ];
  const pad = "\n".repeat(offset - 1);
  return `${pad}${lines.join("\n")}`;
}

describe("hero name duplication", () => {
  it("accepts brand + model pairs", () => {
    const cases: Array<[string, string]> = [
      ["シャープ", "KC-S50"],
      ["サーモス", "JNL-S500"],
      ["ベビービョルン", "HARMONY"],
      ["ベビービョルン", "クレードル"],
      ["アップリカ", "ココネルエアー AB"],
      ["ムーニー", "低刺激であんしん"],
    ];
    for (const [product, line] of cases) {
      expect(
        heroNameDuplicationViolations([
          {
            filePath: "src/pages/articles/ok/index.astro",
            source: sourceWith(product, line),
          },
        ]),
      ).toEqual([]);
    }
  });

  it("rejects a product that already contains the line", () => {
    expect(
      heroNameDuplicationViolations([
        {
          filePath: "src/pages/articles/babybjorn-cradle/index.astro",
          source: sourceWith("ベビービョルン クレードル", "クレードル"),
        },
      ]),
    ).toEqual([
      'src/pages/articles/babybjorn-cradle/index.astro:3: hero name duplication: product "ベビービョルン クレードル" already contains line "クレードル"; use the brand name for product',
    ]);
  });

  it("rejects a product containing the line in the middle (not only as a suffix)", () => {
    expect(
      heroNameDuplicationViolations([
        {
          filePath: "src/pages/articles/moony-m/index.astro",
          source: sourceWith(
            "ムーニー 低刺激であんしん（テープ・M）",
            "低刺激であんしん",
          ),
        },
      ]),
    ).toHaveLength(1);
    expect(
      heroNameDuplicationViolations([
        {
          filePath: "src/pages/articles/moony-m/index.astro",
          source: sourceWith("ムーニー", "低刺激であんしん"),
        },
      ]),
    ).toEqual([]);
  });

  it("rejects duplicate pairs in the same file independently", () => {
    const source = `${sourceWith("ベビービョルン クレードル", "クレードル")}\n${sourceWith(
      "アップリカ ココネルエアー AB",
      "ココネルエアー AB",
    )}`;
    const violations = heroNameDuplicationViolations([
      { filePath: "src/pages/articles/cradle/index.astro", source },
    ]);
    expect(violations).toHaveLength(2);
    expect(violations[0]).toContain('product "ベビービョルン クレードル"');
    expect(violations[1]).toContain('product "アップリカ ココネルエアー AB"');
  });

  it("does not pair a line that belongs to the next candidate", () => {
    const source = [
      "const first: ComparisonCandidate = {",
      "  product: 'ベビービョルン',",
      "  status: 'official',",
      "};",
      "const second: ComparisonCandidate = {",
      "  product: 'シャープ',",
      "  line: 'KC-S50',",
      "  status: 'official',",
      "};",
    ].join("\n");
    expect(
      heroNameDuplicationViolations([
        { filePath: "src/pages/articles/ok/index.astro", source },
      ]),
    ).toEqual([]);
  });

  it("ignores single-character lines to avoid model-size false positives", () => {
    expect(
      heroNameDuplicationViolations([
        {
          filePath: "src/pages/articles/ok/index.astro",
          source: sourceWith("ムーニー（テープ・M）", "M"),
        },
      ]),
    ).toEqual([]);
  });
});
