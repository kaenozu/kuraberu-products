import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePurchaseHref } from "../src/lib/rakuten";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolvePurchaseHref", () => {
  it("returns affiliate URL when a unique product is selected", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const result = await resolvePurchaseHref(
      {
        keyword: "パンパース 肌へのいちばん 新生児",
        requiredTerms: ["パンパース", "肌へのいちばん", "新生児"],
        selection: {
          excludedTerms: ["90枚", "2パック", "セット", "旧モデル"],
          exactIdentifiers: ["4987176203229"],
        },
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              items: [
                {
                  item: {
                    itemCode: "4987176203229",
                    itemName: "パンパース 肌へのいちばん 新生児 テープ 66枚",
                    itemUrl: "https://item.rakuten.co.jp/shop/premium-66",
                    affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/premium-66",
                    itemPrice: 1980,
                  },
                },
              ],
            }),
            { status: 200 },
          ),
        timeoutMs: 100,
      },
    );

    expect(result.href).toContain("hb.afl.rakuten.co.jp");
    expect(result.isAffiliate).toBe(true);
    expect(result.product).toBeDefined();
    expect(result.product?.id).toBe("4987176203229");
  });

  it("returns fallback URL when no product is selected (ambiguous candidates)", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const fallback =
      "https://search.rakuten.co.jp/search/mall/%E3%83%91%E3%83%B3%E3%83%91%E3%83%BC%E3%82%B9/";
    const result = await resolvePurchaseHref(
      {
        keyword: "パンパース",
        requiredTerms: ["パンパース"],
        fallbackUrl: fallback,
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              items: [
                {
                  item: {
                    itemCode: "shop:a",
                    itemName: "パンパース 新生児",
                    itemUrl: "https://item.rakuten.co.jp/shop/a",
                    itemPrice: 1980,
                  },
                },
                {
                  item: {
                    itemCode: "shop:b",
                    itemName: "パンパース 新生児",
                    itemUrl: "https://item.rakuten.co.jp/shop/b",
                    itemPrice: 2100,
                  },
                },
              ],
            }),
            { status: 200 },
          ),
        timeoutMs: 100,
      },
    );

    // fallback is a search URL → toAffiliateRakutenUrl converts to hb.afl redirect
    expect(result.href).toContain("hb.afl.rakuten.co.jp");
    expect(result.isAffiliate).toBe(true);
    expect(result.product).toBeUndefined();
  });

  it("returns product URL when no affiliate URL is available", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const result = await resolvePurchaseHref(
      {
        keyword: "テスト商品",
        requiredTerms: ["テスト"],
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              items: [
                {
                  item: {
                    itemCode: "shop:test",
                    itemName: "テスト商品",
                    itemUrl: "https://item.rakuten.co.jp/shop/test",
                    itemPrice: 1000,
                  },
                },
              ],
            }),
            { status: 200 },
          ),
        timeoutMs: 100,
      },
    );

    expect(result.href).toBe("https://item.rakuten.co.jp/shop/test");
    expect(result.isAffiliate).toBe(false);
    expect(result.product?.id).toBe("shop:test");
  });

  it("returns empty string when no product and no fallback", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const result = await resolvePurchaseHref(
      {
        keyword: "存在しない商品",
        requiredTerms: ["存在しない"],
      },
      {
        fetchImpl: async () =>
          new Response(JSON.stringify({ items: [] }), { status: 200 }),
        timeoutMs: 100,
      },
    );

    expect(result.href).toBe("");
    expect(result.isAffiliate).toBe(false);
    expect(result.product).toBeUndefined();
  });

  it("converts search.rakuten.co.jp fallback to affiliate redirect", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const result = await resolvePurchaseHref(
      {
        keyword: "テスト",
        requiredTerms: ["存在しない"],
        fallbackUrl:
          "https://search.rakuten.co.jp/search/mall/%E3%83%86%E3%82%B9%E3%83%88/",
      },
      {
        fetchImpl: async () =>
          new Response(JSON.stringify({ items: [] }), { status: 200 }),
        timeoutMs: 100,
      },
    );

    expect(result.href).toContain("hb.afl.rakuten.co.jp");
    expect(result.href).toContain("search.rakuten.co.jp");
    expect(result.isAffiliate).toBe(true);
  });

  it("passes through already-affiliate fallback URLs unchanged", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const affiliateUrl = "https://a.r10.to/hPtZZE";
    const result = await resolvePurchaseHref(
      {
        keyword: "テスト",
        requiredTerms: ["存在しない"],
        fallbackUrl: affiliateUrl,
      },
      {
        fetchImpl: async () =>
          new Response(JSON.stringify({ items: [] }), { status: 200 }),
        timeoutMs: 100,
      },
    );

    expect(result.href).toBe(affiliateUrl);
    expect(result.isAffiliate).toBe(true);
  });

  it("selects product over fallback when API returns a match", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const fallback =
      "https://search.rakuten.co.jp/search/mall/%E3%83%86%E3%82%B9%E3%83%88/";
    const result = await resolvePurchaseHref(
      {
        keyword: "テスト",
        requiredTerms: ["テスト"],
        fallbackUrl: fallback,
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              items: [
                {
                  item: {
                    itemCode: "shop:exact",
                    itemName: "テスト商品 モデルA",
                    itemUrl: "https://item.rakuten.co.jp/shop/exact",
                    affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/exact",
                    itemPrice: 3000,
                  },
                },
              ],
            }),
            { status: 200 },
          ),
        timeoutMs: 100,
      },
    );

    expect(result.href).toContain("hb.afl.rakuten.co.jp/hgc/exact");
    expect(result.isAffiliate).toBe(true);
    expect(result.product?.id).toBe("shop:exact");
  });
});
