import { describe, expect, it } from "vitest";
import {
  bestRank,
  findArticleSocialProofBlocks,
  findExternalEmbedTags,
  findSnsRankViolations,
  validateSnsRanksDirectory,
} from "../scripts/validate-sns-ranks.mjs";

const embed = (attrs: string): string => `<ExternalEmbed ${attrs} />`;

function sourceFor(blocks: string): string {
  return `---\nconst page = 1;\n---\n<main>\n${blocks}\n</main>`;
}

describe("findExternalEmbedTags", () => {
  it("extracts embed tags with attribute text", () => {
    const src = `<ExternalEmbed provider="x" match="model" url="https://x.com/a/1" />`;
    const tags = findExternalEmbedTags(src);
    expect(tags).toHaveLength(1);
    expect(tags[0].attrs).toContain('match="model"');
  });

  it("handles multi-line embeds", () => {
    const src = `<ExternalEmbed\n  provider="youtube"\n  match="series"\n  url="https://youtu.be/abc"\n/>`;
    const tags = findExternalEmbedTags(src);
    expect(tags).toHaveLength(1);
    expect(tags[0].attrs).toContain('match="series"');
  });
});

describe("findArticleSocialProofBlocks", () => {
  it("captures children of an open block", () => {
    const src = `<ArticleSocialProof query="q" bestMatch="model">\n<ExternalEmbed match="model" url="u" />\n</ArticleSocialProof>`;
    const blocks = findArticleSocialProofBlocks(src);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].children).toContain("ExternalEmbed");
    expect(blocks[0].selfClosed).toBe(false);
  });

  it("detects a self-closed block", () => {
    const src = `<ArticleSocialProof query="q" hasPosts={false} />`;
    const blocks = findArticleSocialProofBlocks(src);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].selfClosed).toBe(true);
  });
});

describe("bestRank", () => {
  it("orders model > series > brand", () => {
    expect(bestRank(["brand", "series", "model"])).toBe("model");
    expect(bestRank(["brand", "series"])).toBe("series");
    expect(bestRank(["brand"])).toBe("brand");
    expect(bestRank([])).toBeNull();
  });
});

describe("findSnsRankViolations", () => {
  const sources = (src: string) => [
    { filePath: "src/pages/articles/fixture/index.astro", source: src },
  ];

  it("accepts a model section with bestMatch", () => {
    const src = sourceFor(
      `<ArticleSocialProof query="q" checkedAt="2026-08-12" hasPosts={true} bestMatch="model">
${embed('provider="x" match="model" url="https://x.com/a/status/1" title="t"')}
</ArticleSocialProof>`,
    );
    expect(findSnsRankViolations(sources(src))).toEqual([]);
  });

  it("accepts a series section with bestMatch series", () => {
    const src = sourceFor(
      `<ArticleSocialProof query="q" hasPosts={true} bestMatch="series">
${embed('provider="x" match="series" url="https://x.com/a/status/1" title="t"')}
</ArticleSocialProof>`,
    );
    expect(findSnsRankViolations(sources(src))).toEqual([]);
  });

  it("accepts an empty social proof section (no posts found)", () => {
    const src = sourceFor(
      `<ArticleSocialProof query="q" checkedAt="2026-08-12" hasPosts={false} />`,
    );
    expect(findSnsRankViolations(sources(src))).toEqual([]);
  });

  it("rejects a missing match rank on an embed", () => {
    const src = sourceFor(
      `<ArticleSocialProof query="q" hasPosts={true} bestMatch="model">
${embed('provider="x" url="https://x.com/a/status/1" title="t"')}
</ArticleSocialProof>`,
    );
    const violations = findSnsRankViolations(sources(src));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("missing a match rank");
  });

  it("rejects an invalid match rank", () => {
    const src = sourceFor(
      `<ArticleSocialProof query="q" hasPosts={true} bestMatch="model">
${embed('provider="x" match="exact" url="https://x.com/a/status/1" title="t"')}
</ArticleSocialProof>`,
    );
    const violations = findSnsRankViolations(sources(src));
    expect(
      violations.some((v) => v.includes('invalid match rank "exact"')),
    ).toBe(true);
  });

  it("rejects bestMatch that does not match the embedded best rank", () => {
    const src = sourceFor(
      `<ArticleSocialProof query="q" hasPosts={true} bestMatch="model">
${embed('provider="x" match="series" url="https://x.com/a/status/1" title="t"')}
</ArticleSocialProof>`,
    );
    const violations = findSnsRankViolations(sources(src));
    expect(
      violations.some((v) =>
        v.includes('does not match the embedded posts (best rank is "series"'),
      ),
    ).toBe(true);
  });

  it("rejects a C-only (brand) section", () => {
    const src = sourceFor(
      `<ArticleSocialProof query="q" hasPosts={true} bestMatch="brand">
${embed('provider="x" match="brand" url="https://x.com/a/status/1" title="t"')}
</ArticleSocialProof>`,
    );
    const violations = findSnsRankViolations(sources(src));
    expect(
      violations.some((v) =>
        v.includes("must not be rendered when only brand-rank posts exist"),
      ),
    ).toBe(true);
  });

  it("rejects bestMatch declared without any embeds", () => {
    const src = sourceFor(
      `<ArticleSocialProof query="q" hasPosts={true} bestMatch="model" />`,
    );
    const violations = findSnsRankViolations(sources(src));
    expect(violations.some((v) => v.includes("declares bestMatch"))).toBe(true);
  });

  it("rejects embeds declared outside an ArticleSocialProof section", () => {
    const src = sourceFor(
      `${embed('provider="x" match="model" url="https://x.com/a/status/1" title="t"')}`,
    );
    const violations = findSnsRankViolations(sources(src));
    expect(
      violations.some((v) =>
        v.includes("must be declared inside an ArticleSocialProof"),
      ),
    ).toBe(true);
  });

  it("rejects embeds with hasPosts not set to true", () => {
    const src = sourceFor(
      `<ArticleSocialProof query="q" bestMatch="model">
${embed('provider="x" match="model" url="https://x.com/a/status/1" title="t"')}
</ArticleSocialProof>`,
    );
    const violations = findSnsRankViolations(sources(src));
    expect(violations.some((v) => v.includes("hasPosts is not true"))).toBe(
      true,
    );
  });

  it("reports the source line number", () => {
    const src = `---\nconst x = 1;\n---\n<main>\n${embed('provider="x" url="https://x.com/a/status/1" title="t"')}\n</main>`;
    const violations = findSnsRankViolations(sources(src));
    expect(violations[0]).toMatch(/index\.astro:5:/);
  });
});

describe("validateSnsRanksDirectory", () => {
  it("passes on the real article directory", () => {
    expect(validateSnsRanksDirectory()).toEqual([]);
  });
});
