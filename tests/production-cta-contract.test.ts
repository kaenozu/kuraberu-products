import { describe, expect, it } from "vitest";
import { validateProductionCtas } from "../scripts/production-cta-contract.mjs";

const valid = (productId: string) =>
  `<a class="cta" href="https://hb.afl.rakuten.co.jp/example/${productId}" rel="sponsored nofollow noopener noreferrer" data-product-id="${productId}">購入</a>`;

describe("production CTA contract", () => {
  it("accepts one sponsored CTA for each product", () => {
    expect(
      validateProductionCtas(
        valid("pampers-premium-newborn") + valid("pampers-sarasara-newborn"),
        "fixture.html",
      ),
    ).toEqual([]);
  });

  it("does not mistake Rakuten search links for product CTAs", () => {
    const html =
      '<a href="https://search.rakuten.co.jp/search/mall/pampers/">検索</a>';
    expect(validateProductionCtas(html, "fixture.html").join("\n")).toContain(
      "pampers-premium-newborn",
    );
  });

  it("rejects a CTA without sponsored nofollow attributes", () => {
    const html =
      valid("pampers-premium-newborn").replace("sponsored nofollow ", "") +
      valid("pampers-sarasara-newborn");
    expect(validateProductionCtas(html, "fixture.html").join("\n")).toContain(
      "sponsored nofollow",
    );
  });
});
