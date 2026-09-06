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

    expect(result.href).toBe("https://hb.afl.rakuten.co.jp/hgc/premium-66");
    expect(result.isAffiliate).toBe(true);
    expect(result.product).toBeDefined();
    expect(result.product?.id).toBe("4987176203229");
  });

  it("fails closed with an empty href when candidates stay ambiguous (#436)", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const result = await resolvePurchaseHref(
      {
        keyword: "パンパース",
        requiredTerms: ["パンパース"],
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

    // 曖昧候補のとき検索結果URLへフォールバックするのは禁止（#436）。
    // 確認できない到達先は空 href とし、CTA表示側で fail-closed にする。
    expect(result.product).toBeUndefined();
    expect(result.href).toBe("");
    expect(result.isAffiliate).toBe(false);
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

  it("returns an empty href and no product when no candidate matches the required terms (#436)", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const result = await resolvePurchaseHref(
      {
        keyword: "テスト",
        requiredTerms: ["存在しない"],
      },
      {
        fetchImpl: async () =>
          new Response(JSON.stringify({ items: [] }), { status: 200 }),
        timeoutMs: 100,
      },
    );

    // 検索結果ページへのフォールバック口は廃止（#436）。候補が無ければ空。
    expect(result.href).toBe("");
    expect(result.isAffiliate).toBe(false);
  });

  it("does not adopt a bare affiliate shortlink as the destination (#436)", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const result = await resolvePurchaseHref(
      {
        keyword: "テスト",
        requiredTerms: ["存在しない"],
      },
      {
        fetchImpl: async () =>
          new Response(JSON.stringify({ items: [] }), { status: 200 }),
        timeoutMs: 100,
      },
    );

    // 裸の短縮URL（pc 到達先を確認できない）は購入CTAに使えない（#436）。
    expect(result.href).toBe("");
    expect(result.isAffiliate).toBe(false);
  });

  it("selects the verified product when the API returns a match", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
    const result = await resolvePurchaseHref(
      {
        keyword: "テスト",
        requiredTerms: ["テスト"],
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
