import { describe, expect, it } from "vitest";
import { checkAffiliateLinkCompleteness } from "../scripts/check-purchase-link-consistency.mjs";

describe("affiliate link completeness gate", () => {
  it("requires Rakuten affiliate URL and Amazon ASIN for every verified comparison side", () => {
    const result = checkAffiliateLinkCompleteness({
      registry: {
        "sample:left": {
          name: "Sample A",
          purchaseUrl: "https://item.rakuten.co.jp/shop/a/",
          rakutenProductUrl: "https://item.rakuten.co.jp/shop/a/",
          rakutenAffiliateUrl:
            "https://hb.afl.rakuten.co.jp/hgc/example/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fshop%2Fa%2F",
          amazonAsin: "B0D9XZ5MQF",
        },
        "sample:right": {
          name: "Sample B",
          purchaseUrl: "https://item.rakuten.co.jp/shop/b/",
          rakutenProductUrl: "https://item.rakuten.co.jp/shop/b/",
        },
      },
      verifiedComparisons: ["sample"],
    });

    expect(result).toEqual([
      expect.objectContaining({
        key: "sample:right",
        missing: ["rakutenAffiliateUrl", "amazonAsin"],
      }),
    ]);
  });

  it("rejects a direct Rakuten URL as the affiliate CTA", () => {
    const result = checkAffiliateLinkCompleteness({
      registry: {
        "sample:left": {
          name: "Sample A",
          rakutenProductUrl: "https://item.rakuten.co.jp/shop/a/",
          rakutenAffiliateUrl: "https://item.rakuten.co.jp/shop/a/",
          amazonAsin: "B0D9XZ5MQF",
        },
        "sample:right": {
          name: "Sample B",
          rakutenProductUrl: "https://item.rakuten.co.jp/shop/b/",
          rakutenAffiliateUrl:
            "https://hb.afl.rakuten.co.jp/hgc/example/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fshop%2Fb%2F",
          amazonAsin: "B0D9XZ5MQG",
        },
      },
      verifiedComparisons: ["sample"],
    });

    expect(result).toEqual([
      expect.objectContaining({
        key: "sample:left",
        invalid: ["rakutenAffiliateUrl"],
      }),
    ]);
  });
});
