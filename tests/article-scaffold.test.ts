import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import YAML from "yaml";
import * as prettier from "prettier";
import {
  slugToConstName,
  validateInput,
  renderArticleTs,
  renderPageAstro,
  applyIndexEdits,
  applyShimEdits,
  runArticleAdd,
} from "../scripts/article-add.mjs";

const CHECKED_AT = "2026-09-03";

function validInput() {
  return {
    slug: "panasonic-ne-ms4c-vs-ne-bs5c",
    category: "キッチン家電",
    productType: "オーブンレンジ",
    left: {
      brand: "パナソニック",
      model: "NE-MS4C",
      officialUrl: "https://panasonic.jp/range/products/NE-MS4C.html",
      image: "/products/panasonic-ne-ms4c.png",
      tagline: "軽さ・シンプル操作なら",
      guidePoints: ["シンプルな操作を重視する人"],
    },
    right: {
      brand: "パナソニック",
      model: "NE-BS5C",
      officialUrl: "https://panasonic.jp/range/products/NE-BS5C.html",
      image: "/products/panasonic-ne-bs5c.png",
      tagline: "表示・グリル機能なら",
      guidePoints: ["機能を重視する人"],
    },
    differences: [
      { label: "本体質量", left: "14.2kg", right: "14.7kg", highlight: "left" },
      { label: "自動メニュー数", left: "51", right: "55", highlight: "right" },
    ],
    faq: [{ question: "どちらが軽い？", answer: "NE-MS4Cが14.2kgです。" }],
    checkedAt: CHECKED_AT,
  };
}

function withTempRoot() {
  const root = mkdtempSync(join(tmpdir(), "article-add-"));
  mkdirSync(join(root, "src", "content", "articles"), { recursive: true });
  mkdirSync(join(root, "src", "pages", "articles"), { recursive: true });
  mkdirSync(join(root, "public", "products"), { recursive: true });
  return root;
}

describe("slugToConstName", () => {
  it("derives the export name from a slug", () => {
    expect(slugToConstName("panasonic-ne-ms4c-vs-ne-bs5c")).toBe(
      "panasonicNeMs4cVsNeBs5cArticle",
    );
    expect(slugToConstName("tiger-jpv-l100-vs-jpv-m100")).toBe(
      "tigerJpvL100VsJpvM100Article",
    );
  });
});

describe("validateInput", () => {
  it("accepts the documented YAML shape", () => {
    const root = withTempRoot();
    const { errors } = validateInput(validInput(), { root });
    expect(errors).toEqual([]);
  });

  it("accepts YAML parsed from text", () => {
    const root = withTempRoot();
    const text = `
slug: panasonic-ne-ms4c-vs-ne-bs5c
category: キッチン家電
left:
  brand: パナソニック
  model: NE-MS4C
  officialUrl: https://panasonic.jp/range/products/NE-MS4C.html
  image: /products/panasonic-ne-ms4c.png
  tagline: 軽さ・シンプル操作なら
  guidePoints:
    - シンプルな操作を重視する人
right:
  brand: パナソニック
  model: NE-BS5C
  officialUrl: https://panasonic.jp/range/products/NE-BS5C.html
  image: /products/panasonic-ne-bs5c.png
  tagline: 表示・グリル機能なら
  guidePoints:
    - 機能を重視する人
differences:
  - label: 本体質量
    left: 14.2kg
    right: 14.7kg
    highlight: left
faq:
  - question: どちらが軽い？
    answer: NE-MS4Cが14.2kgです。
checkedAt: ${CHECKED_AT}
`;
    const parsed = YAML.parse(text);
    const { errors } = validateInput(parsed, { root });
    expect(errors).toEqual([]);
  });

  it("rejects bad slugs, non-https URLs, same models, and bad dates", () => {
    const root = withTempRoot();
    const badSlug = { ...validInput(), slug: "Panasonic_BAD" };
    expect(validateInput(badSlug, { root }).errors.length).toBeGreaterThan(0);

    const http = validInput();
    http.left.officialUrl = "http://panasonic.jp/range/products/NE-MS4C.html";
    expect(
      validateInput(http, { root }).errors.some((message) =>
        message.includes("left.officialUrl"),
      ),
    ).toBe(true);

    const same = validInput();
    same.right.model = "NE-MS4C";
    expect(
      validateInput(same, { root }).errors.some((message) =>
        message.includes("must differ"),
      ),
    ).toBe(true);

    const future = validInput();
    future.checkedAt = "2999-01-01";
    expect(
      validateInput(future, { root }).errors.some((message) =>
        message.includes("future"),
      ),
    ).toBe(true);

    const noFaq = validInput();
    noFaq.faq = [];
    expect(
      validateInput(noFaq, { root }).errors.some((message) =>
        message.includes("faq"),
      ),
    ).toBe(true);

    const badHighlight = validInput();
    badHighlight.differences = [
      { label: "本体質量", left: "14.2kg", right: "14.7kg", highlight: "both" },
    ];
    expect(
      validateInput(badHighlight, { root }).errors.some((message) =>
        message.includes("highlight"),
      ),
    ).toBe(true);
  });

  it("reports duplicates against an existing tree", () => {
    const root = withTempRoot();
    mkdirSync(join(root, "src", "pages", "articles", validInput().slug), {
      recursive: true,
    });
    const { errors } = validateInput(validInput(), { root });
    expect(errors.some((message) => message.includes("already exists"))).toBe(
      true,
    );
  });
});

describe("renderers", () => {
  it("renders metadata only from YAML data", () => {
    const ts = renderArticleTs(validInput());
    expect(ts).toContain('id: "panasonic-ne-ms4c-vs-ne-bs5c"');
    expect(ts).toContain("export const panasonicNeMs4cVsNeBs5cArticle");
    expect(ts).toContain('path: "/articles/panasonic-ne-ms4c-vs-ne-bs5c/"');
    expect(ts).toContain("NE-MS4C");
    expect(ts).toContain("NE-BS5C");
    expect(ts).toContain("本体質量");
    expect(ts).toContain("どちらが軽い？");
    expect(ts).toContain(CHECKED_AT);
  });

  it("renders prettier-clean TypeScript through the pipeline", async () => {
    const { formatTs } = await import("../scripts/article-add.mjs");
    const { source, formatted } = await formatTs(renderArticleTs(validInput()));
    expect(formatted).toBe(true);
    await expect(
      prettier.check(source, { parser: "typescript" }),
    ).resolves.toBe(true);
  });

  it("renders a one-line articleId page", () => {
    const astro = renderPageAstro(validInput());
    expect(astro).toContain(
      '<ArticleComparisonPage articleId="panasonic-ne-ms4c-vs-ne-bs5c" />',
    );
  });
});

const INDEX_FIXTURE = `export { aArticle } from "./a";

// Commercial article exports
export { commercialArticleSeeds } from "./commercial";

import { aArticle } from "./a";
import { commercialArticleSeeds, createCommercialArticle } from "./commercial";

export const articleMetadata = Object.freeze([
  aArticle,
  ...additionalCommercialArticles,
]);
`;

const SHIM_FIXTURE = `export {
  aArticle,
  // Commercial article exports
  articleMetadata,
} from "./articles/index";
`;

describe("registry edits", () => {
  it("inserts export, import, and array entries", () => {
    const next = applyIndexEdits(INDEX_FIXTURE, {
      constName: "panasonicNeMs4cVsNeBs5cArticle",
      slug: "panasonic-ne-ms4c-vs-ne-bs5c",
    });
    expect(next).toContain(
      'export { panasonicNeMs4cVsNeBs5cArticle } from "./panasonic-ne-ms4c-vs-ne-bs5c";',
    );
    expect(next).toContain(
      'import { panasonicNeMs4cVsNeBs5cArticle } from "./panasonic-ne-ms4c-vs-ne-bs5c";',
    );
    expect(next).toContain("  panasonicNeMs4cVsNeBs5cArticle,\n");
  });

  it("adds the shim export", () => {
    const next = applyShimEdits(SHIM_FIXTURE, {
      constName: "panasonicNeMs4cVsNeBs5cArticle",
    });
    expect(next).toContain("  panasonicNeMs4cVsNeBs5cArticle,\n");
  });

  it("refuses double registration", () => {
    const once = applyIndexEdits(INDEX_FIXTURE, {
      constName: "panasonicNeMs4cVsNeBs5cArticle",
      slug: "panasonic-ne-ms4c-vs-ne-bs5c",
    });
    expect(() =>
      applyIndexEdits(once, {
        constName: "panasonicNeMs4cVsNeBs5cArticle",
        slug: "panasonic-ne-ms4c-vs-ne-bs5c",
      }),
    ).toThrow(/already registered/);
    const shimOnce = applyShimEdits(SHIM_FIXTURE, {
      constName: "panasonicNeMs4cVsNeBs5cArticle",
    });
    expect(() =>
      applyShimEdits(shimOnce, {
        constName: "panasonicNeMs4cVsNeBs5cArticle",
      }),
    ).toThrow(/already exported/);
  });
});

describe("runArticleAdd end to end", () => {
  it("writes article, page, and registry updates into a fixture tree", async () => {
    const root = withTempRoot();
    writeFileSync(
      join(root, "src", "content", "articles", "index.ts"),
      INDEX_FIXTURE,
    );
    writeFileSync(join(root, "src", "content", "articles.ts"), SHIM_FIXTURE);
    const yamlPath = join(root, "input.yaml");
    writeFileSync(yamlPath, YAML.stringify(validInput()));

    const result = await runArticleAdd({ root, yamlPath });
    expect(result.constName).toBe("panasonicNeMs4cVsNeBs5cArticle");

    const articleTs = readFileSync(
      join(
        root,
        "src",
        "content",
        "articles",
        "panasonic-ne-ms4c-vs-ne-bs5c.ts",
      ),
      "utf-8",
    );
    expect(articleTs).toContain("panasonicNeMs4cVsNeBs5cArticle");

    const page = readFileSync(
      join(
        root,
        "src",
        "pages",
        "articles",
        "panasonic-ne-ms4c-vs-ne-bs5c",
        "index.astro",
      ),
      "utf-8",
    );
    expect(page).toContain('articleId="panasonic-ne-ms4c-vs-ne-bs5c"');

    const index = readFileSync(
      join(root, "src", "content", "articles", "index.ts"),
      "utf-8",
    );
    expect(index).toContain("panasonicNeMs4cVsNeBs5cArticle");

    // second run must fail on duplicates
    await expect(runArticleAdd({ root, yamlPath })).rejects.toThrow(/already/);
  });

  it("supports --check mode without writing", async () => {
    const root = withTempRoot();
    writeFileSync(
      join(root, "src", "content", "articles", "index.ts"),
      INDEX_FIXTURE,
    );
    writeFileSync(join(root, "src", "content", "articles.ts"), SHIM_FIXTURE);
    const yamlPath = join(root, "input.yaml");
    writeFileSync(yamlPath, YAML.stringify(validInput()));

    await runArticleAdd({ root, yamlPath, check: true });
    expect(() =>
      readFileSync(
        join(
          root,
          "src",
          "content",
          "articles",
          "panasonic-ne-ms4c-vs-ne-bs5c.ts",
        ),
      ),
    ).toThrow();
  });
});
