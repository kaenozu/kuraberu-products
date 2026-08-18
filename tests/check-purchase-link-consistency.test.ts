import { describe, expect, it } from "vitest";
import {
  checkArticleSource,
  extractNextStepHrefs,
  extractPurchaseCardHrefs,
} from "../scripts/check-purchase-link-consistency.mjs";

describe("purchase link consistency gate", () => {
  it("extracts next-step purchaseHref from an ArticleComparisonV2 page in left/right order", () => {
    const source = `<ArticleComparisonV2
  left={{ brand: "A", line: "L", purchaseHref: "https://a.r10.to/AAA" }}
  right={{ brand: "B", line: "M", purchaseHref: "https://a.r10.to/BBB" }}
/>`;
    expect(extractNextStepHrefs(source)).toEqual([
      '"https://a.r10.to/AAA"',
      '"https://a.r10.to/BBB"',
    ]);
  });

  it("extracts hrefs from a direct NextStepBlock usage", () => {
    const source = `
<NextStepBlock
  left={{ href: "https://hb.afl/1", productId: "p1" }}
  right={{ href: "https://hb.afl/2", productId: "p2" }}
/>
`;
    expect(extractNextStepHrefs(source)).toEqual([
      '"https://hb.afl/1"',
      '"https://hb.afl/2"',
    ]);
  });

  it("extracts PurchaseCard hrefs in document order (braced and literal)", () => {
    const source = `
<PurchaseCard href={"https://a.r10.to/AAA"} name="A" />
<PurchaseCard href="https://a.r10.to/BBB" name="B" />
`;
    expect(extractPurchaseCardHrefs(source)).toEqual([
      '"https://a.r10.to/AAA"',
      '"https://a.r10.to/BBB"',
    ]);
  });

  it("returns null for guide articles without a next-step block", () => {
    const source = `---
---
<h1>guide</h1>
<PurchaseCard href="https://a.r10.to/AAA" name="A" />
`;
    expect(extractNextStepHrefs(source)).toBeNull();
  });

  it("accepts a page where block links match article-end PurchaseCards in the same order", () => {
    const source = `<ArticleComparisonV2
  left={{ brand: "A", line: "L", purchaseHref: "https://a.r10.to/AAA" }}
  right={{ brand: "B", line: "M", purchaseHref: "https://a.r10.to/BBB" }}
/>
<PurchaseCard href={"https://a.r10.to/AAA"} name="A" />
<PurchaseCard href={"https://a.r10.to/BBB"} name="B" />
`;
    const errors: string[] = [];
    checkArticleSource(source, "pages/articles/sample/index.astro", errors);
    expect(errors).toEqual([]);
  });

  it("flags a drift where the article-end card was updated but the block was not", () => {
    const source = `<ArticleComparisonV2
  left={{ brand: "A", line: "L", purchaseHref: "https://a.r10.to/OLD" }}
  right={{ brand: "B", line: "M", purchaseHref: "https://a.r10.to/BBB" }}
/>
<PurchaseCard href={"https://a.r10.to/NEW"} name="A" />
<PurchaseCard href={"https://a.r10.to/BBB"} name="B" />
`;
    const errors: string[] = [];
    checkArticleSource(source, "pages/articles/sample/index.astro", errors);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("pages/articles/sample/index.astro");
    expect(errors[0]).toContain("https://a.r10.to/OLD");
    expect(errors[0]).toContain("https://a.r10.to/NEW");
  });

  it("flags a missing purchaseHref in the block when the card has one", () => {
    const source = `<ArticleComparisonV2
  left={{ brand: "A", line: "L" }}
  right={{ brand: "B", line: "M", purchaseHref: "https://a.r10.to/BBB" }}
/>
<PurchaseCard href={"https://a.r10.to/AAA"} name="A" />
<PurchaseCard href={"https://a.r10.to/BBB"} name="B" />
`;
    const errors: string[] = [];
    checkArticleSource(source, "pages/articles/sample/index.astro", errors);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("missing");
  });

  it("flags an order swap between block and article-end cards", () => {
    const source = `<ArticleComparisonV2
  left={{ brand: "A", line: "L", purchaseHref: "https://a.r10.to/AAA" }}
  right={{ brand: "B", line: "M", purchaseHref: "https://a.r10.to/BBB" }}
/>
<PurchaseCard href={"https://a.r10.to/BBB"} name="B" />
<PurchaseCard href={"https://a.r10.to/AAA"} name="A" />
`;
    const errors: string[] = [];
    checkArticleSource(source, "pages/articles/sample/index.astro", errors);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("#1");
    expect(errors[1]).toContain("#2");
  });
});
