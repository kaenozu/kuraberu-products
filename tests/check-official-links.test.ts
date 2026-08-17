import { describe, expect, it } from "vitest";
import {
  AFFILIATE_URL_PATTERN,
  extractBalancedBody,
  findOfficialHrefViolations,
  resolveOfficialHref,
  validateOfficialHrefDirectory,
} from "../scripts/check-official-links.mjs";

function sourceWith(expr: string): string {
  return `const leftOfficial = 'https://www.babybjorn.jp/products/cradle/';\nconst plusOfficial = 'https://www.combi.co.jp/store/carseat/thesplus/g/g120066/';\nconst plus = { official: plusOfficial };\nconst officialPage = leftOfficial;\n<ArticleComparisonV2 left={{ brand: 'x', line: 'y', officialHref: ${expr}, guidePoints: [] }} />`;
}

describe("affiliate URL pattern", () => {
  it.each([
    "https://a.r10.to/hgxfw5",
    "https://r10.to/hgxfw5",
    "http://a.r10.to/hgxfw5",
    "https://hb.afl.rakuten.co.jp/hgc/example",
    "https://hb.afl.rakuten.co.jp",
    "https://www.a.r10.to/x",
  ])("flags %s", (url) => {
    expect(AFFILIATE_URL_PATTERN.test(url)).toBe(true);
  });

  it.each([
    "https://www.babybjorn.jp/products/cradle/",
    "https://panasonic.jp/range/products/NE-FL1A.html",
    "https://www.thermos.jp/product/series/jnl-s00.html",
    "https://www.rakuten.ne.jp/gold/babybjorn/",
    "https://search.rakuten.co.jp/search/mall/KX-HC705",
  ])("accepts %s", (url) => {
    expect(AFFILIATE_URL_PATTERN.test(url)).toBe(false);
  });
});

describe("resolveOfficialHref", () => {
  const source = sourceWith("leftOfficial");
  const productsText = `export const thermosJnlS500 = {\n  officialUrl: "https://www.thermos.jp/product/series/jnl-s00.html",\n  rakutenUrl: "https://a.r10.to/hPl2PS",\n};\nexport const tigerMtaJ050 = {\n  officialUrl: "https://www.tiger-corporation.com/ja/jpn/product/vacuum-insulated-products/mta-j/",\n};\n`;

  it("resolves a literal URL", () => {
    expect(
      resolveOfficialHref(
        source,
        "'https://www.babybjorn.jp/a/'",
        productsText,
      ),
    ).toBe("https://www.babybjorn.jp/a/");
  });

  it("resolves a local const to its URL literal", () => {
    expect(resolveOfficialHref(source, "leftOfficial", productsText)).toBe(
      "https://www.babybjorn.jp/products/cradle/",
    );
  });

  it("resolves a const that chains to another const", () => {
    expect(resolveOfficialHref(source, "officialPage", productsText)).toBe(
      "https://www.babybjorn.jp/products/cradle/",
    );
  });

  it("resolves a same-file object property", () => {
    expect(resolveOfficialHref(source, "plus.official", productsText)).toBe(
      "https://www.combi.co.jp/store/carseat/thesplus/g/g120066/",
    );
  });

  it("resolves an imported product object property via products.ts", () => {
    const imported = `import { thermosJnlS500 } from '../../../lib/products';\n<ArticleComparisonV2 officialHref={thermosJnlS500.officialUrl} />`;
    expect(
      resolveOfficialHref(imported, "thermosJnlS500.officialUrl", productsText),
    ).toBe("https://www.thermos.jp/product/series/jnl-s00.html");
  });

  it("returns null for an unresolvable identifier", () => {
    expect(resolveOfficialHref(source, "missingOfficial", productsText)).toBe(
      null,
    );
  });

  it("returns null when the resolution chain is too deep", () => {
    let nested = "const a0 = 'https://x.example/a';";
    for (let index = 1; index <= 10; index += 1) {
      nested += `\nconst a${index} = a${index - 1};`;
    }
    expect(resolveOfficialHref(nested, "a10", "")).toBe(null);
  });
});

describe("extractBalancedBody", () => {
  it("returns the body between matching braces", () => {
    expect(extractBalancedBody("const x = { a: 1, b: { c: 2 } };", 10)).toBe(
      " a: 1, b: { c: 2 } ",
    );
  });

  it("ignores braces inside string literals", () => {
    expect(extractBalancedBody("const x = { a: '{' };", 10)).toBe(" a: '{' ");
  });

  it("returns null for an unterminated block", () => {
    expect(extractBalancedBody("const x = { a: 1", 10)).toBe(null);
  });
});

describe("findOfficialHrefViolations", () => {
  it("passes for official manufacturer URLs", () => {
    expect(
      findOfficialHrefViolations(
        [
          {
            filePath: "src/pages/articles/a/index.astro",
            source: sourceWith("leftOfficial"),
          },
          {
            filePath: "src/pages/articles/b/index.astro",
            source: sourceWith("plus.official"),
          },
        ],
        "",
      ),
    ).toEqual([]);
  });

  it("fails for a const that resolves to an affiliate URL", () => {
    const source = `const badOfficial = 'https://a.r10.to/hgxfw5';\n<HeroComparison left={{ officialHref: badOfficial }} />`;
    expect(
      findOfficialHrefViolations(
        [{ filePath: "src/pages/articles/bad/index.astro", source }],
        "",
      ),
    ).toEqual([
      'src/pages/articles/bad/index.astro:2: officialHref "badOfficial" resolves to affiliate URL https://a.r10.to/hgxfw5; official links must point to the manufacturer page',
    ]);
  });

  it("fails for an inline affiliate URL literal", () => {
    const source = `<HeroComparison left={{ officialHref: 'https://hb.afl.rakuten.co.jp/hgc/x' }} />`;
    expect(
      findOfficialHrefViolations(
        [{ filePath: "src/pages/articles/bad/index.astro", source }],
        "",
      ),
    ).toHaveLength(1);
    expect(
      findOfficialHrefViolations([
        { filePath: "src/pages/articles/bad/index.astro", source },
      ])[0],
    ).toContain("resolves to affiliate URL https://hb.afl.rakuten.co.jp/hgc/x");
  });

  it("fails closed when the value cannot be resolved", () => {
    const source = `<HeroComparison left={{ officialHref: mysteryOfficial }} />`;
    expect(
      findOfficialHrefViolations(
        [{ filePath: "src/pages/articles/bad/index.astro", source }],
        "",
      ),
    ).toEqual([
      'src/pages/articles/bad/index.astro:1: cannot resolve officialHref value "mysteryOfficial" to a URL; use a literal or a local const so the official/advertising separation can be verified',
    ]);
  });

  it("flags an imported product whose officialUrl is an affiliate link", () => {
    const source = `<HeroComparison left={{ officialHref: thermosJnlS500.officialUrl }} />`;
    const productsText = `export const thermosJnlS500 = {\n  officialUrl: "https://a.r10.to/hPl2PS",\n};`;
    expect(
      findOfficialHrefViolations(
        [{ filePath: "src/pages/articles/bad/index.astro", source }],
        productsText,
      ),
    ).toHaveLength(1);
    expect(
      findOfficialHrefViolations(
        [{ filePath: "src/pages/articles/bad/index.astro", source }],
        productsText,
      )[0],
    ).toContain("affiliate URL https://a.r10.to/hPl2PS");
  });

  it("reports each occurrence separately", () => {
    const source = `const badOfficial = 'https://a.r10.to/x';\n<HeroComparison left={{ officialHref: badOfficial }} right={{ officialHref: badOfficial }} />`;
    expect(
      findOfficialHrefViolations(
        [{ filePath: "src/pages/articles/bad/index.astro", source }],
        "",
      ),
    ).toHaveLength(2);
  });
});

describe("real repository", () => {
  it("passes for every article page with the current source", () => {
    const violations = validateOfficialHrefDirectory();
    expect(violations).toEqual([]);
  });
});
