import { describe, expect, it } from "vitest";
import {
  checkArticleSource,
  checkPurchaseLinkConsistency,
  extractNextStepHrefs,
  extractPurchaseCardHrefs,
  keyFromRef,
  loadRegistryKeys,
} from "../scripts/check-purchase-link-consistency.mjs";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const registry = new Set(["moony-m:left", "moony-m:right"]);

describe("purchase link consistency gate (registry keys)", () => {
  it("extracts registry keys from an ArticleComparisonV2 page in left/right order", () => {
    const source = `<ArticleComparisonV2
  left={{ brand: "A", line: "L", purchaseHref: articlePurchaseLinks['moony-m:left'].purchaseUrl }}
  right={{ brand: "B", line: "M", purchaseHref: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>`;
    expect(extractNextStepHrefs(source)!.map(keyFromRef)).toEqual([
      "moony-m:left",
      "moony-m:right",
    ]);
  });

  it("extracts keys from a direct NextStepBlock usage", () => {
    const source = `<NextStepBlock
  left={{ label: "A", href: articlePurchaseLinks['moony-m:left'].purchaseUrl }}
  right={{ label: "B", href: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>`;
    expect(extractNextStepHrefs(source)!.map(keyFromRef)).toEqual([
      "moony-m:left",
      "moony-m:right",
    ]);
  });

  it("extracts PurchaseCard hrefs in document order", () => {
    const source = `
<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} name="A" />
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} name="B" />
`;
    expect(extractPurchaseCardHrefs(source).map(keyFromRef)).toEqual([
      "moony-m:left",
      "moony-m:right",
    ]);
  });

  it("returns null for guide articles without a next-step block", () => {
    const source = `<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} name="A" />`;
    expect(extractNextStepHrefs(source)).toBeNull();
  });

  it("loads registry keys from lib/products.ts", () => {
    const directory = mkdtempSync(join(tmpdir(), "purchase-link-gate-"));
    try {
      mkdirSync(join(directory, "lib"), { recursive: true });
      writeFileSync(
        join(directory, "lib", "products.ts"),
        `export const articlePurchaseLinks = {\n  "a:left": { name: "A", purchaseUrl: "https://a.r10.to/x" },\n  "a:right": { name: "B", purchaseUrl: "https://a.r10.to/y" },\n} as const satisfies Record<string, ArticlePurchaseLink>;\n`,
      );
      expect(loadRegistryKeys(directory)).toEqual(
        new Set(["a:left", "a:right"]),
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("accepts a page where block keys match article-end PurchaseCards in order", () => {
    const source = `<ArticleComparisonV2
  left={{ purchaseHref: articlePurchaseLinks['moony-m:left'].purchaseUrl }}
  right={{ purchaseHref: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>
<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} />
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/sample/index.astro",
      errors,
      registry,
    );
    expect(errors).toEqual([]);
  });

  it("rejects a raw https purchase URL instead of a registry reference", () => {
    const source = `<ArticleComparisonV2
  left={{ purchaseHref: 'https://a.r10.to/OLD' }}
  right={{ purchaseHref: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>
<PurchaseCard href={'https://a.r10.to/OLD'} />
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/sample/index.astro",
      errors,
      registry,
    );
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain(
      "must come from the articlePurchaseLinks registry",
    );
    expect(errors[0]).toContain("https://a.r10.to/OLD");
  });

  it("rejects an unknown registry key", () => {
    const source = `<ArticleComparisonV2
  left={{ purchaseHref: articlePurchaseLinks['moony-m:leff'].purchaseUrl }}
  right={{ purchaseHref: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>
<PurchaseCard href={articlePurchaseLinks['moony-m:leff'].purchaseUrl} />
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/sample/index.astro",
      errors,
      registry,
    );
    expect(errors).toEqual([
      'pages/articles/sample/index.astro: articlePurchaseLinks has no entry for "moony-m:leff"',
    ]);
  });

  it("flags an order swap between block and article-end cards", () => {
    const source = `<ArticleComparisonV2
  left={{ purchaseHref: articlePurchaseLinks['moony-m:left'].purchaseUrl }}
  right={{ purchaseHref: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} />
<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/sample/index.astro",
      errors,
      registry,
    );
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("#1");
    expect(errors[1]).toContain("#2");
  });

  it("accepts a single-card guide using a registry reference", () => {
    const source = `<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} name="A" />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/sample/index.astro",
      errors,
      registry,
    );
    expect(errors).toEqual([]);
  });

  it("skips the commercial template (dynamic API resolution)", () => {
    const source = `<CommercialArticlePage articleId="x" />
<PurchaseCard href={leftSearch} />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/x/index.astro",
      errors,
      registry,
    );
    expect(errors).toEqual([]);
  });

  it("reports a missing registry when running the full check", () => {
    const directory = mkdtempSync(join(tmpdir(), "purchase-link-gate-full-"));
    try {
      mkdirSync(join(directory, "pages", "articles"), { recursive: true });
      const errors = checkPurchaseLinkConsistency({ srcDirectory: directory });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(" ")).toContain("products.ts");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
