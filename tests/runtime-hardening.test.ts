import { describe, expect, it, vi } from "vitest";
import { isAllowedRakutenUrl } from "../config/runtime-env.mjs";
import {
  requestRakutenProducts,
  RAKUTEN_API_TIMEOUT_MS,
} from "../src/lib/rakuten";

describe("public URL boundaries", () => {
  it("allows approved Rakuten hosts and rejects unrelated hosts", () => {
    expect(
      isAllowedRakutenUrl("https://hb.afl.rakuten.co.jp/hgc/example"),
    ).toBe(true);
    expect(
      isAllowedRakutenUrl("https://item.rakuten.co.jp/shop/item"),
    ).toBe(true);
    expect(isAllowedRakutenUrl("https://r10.to/example")).toBe(true);
    expect(isAllowedRakutenUrl("https://example.test/item")).toBe(false);
    expect(isAllowedRakutenUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("Rakuten API request", () => {
  it("parses an approved response without logging credentials", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          items: [
            {
              itemCode: "shop:item-1",
              itemName: "パンパース 肌へのいちばん 新生児",
              itemUrl: "https://item.rakuten.co.jp/shop/item-1",
              affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/item-1",
              itemPrice: 1980,
            },
          ],
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const products = await requestRakutenProducts(
      new URL("https://openapi.rakuten.co.jp/example"),
      "secret-access-key",
      { fetchImpl, timeoutMs: 100 },
    );

    expect(products).toHaveLength(1);
    expect(products[0]?.affiliateUrl).toMatch(/^https:\/\/hb\.afl\.rakuten/);
  });

  it("aborts a stalled request and returns an empty fallback", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchImpl = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        }),
    ) as unknown as typeof fetch;

    const products = await requestRakutenProducts(
      new URL("https://openapi.rakuten.co.jp/example"),
      "secret-access-key",
      { fetchImpl, timeoutMs: 5 },
    );

    expect(RAKUTEN_API_TIMEOUT_MS).toBeGreaterThan(0);
    expect(products).toEqual([]);
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining("タイムアウト"),
    );
    expect(warning.mock.calls.flat().join(" ")).not.toContain(
      "secret-access-key",
    );
    warning.mockRestore();
  });

  it("rejects non-Rakuten URLs returned by the API", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          items: [
            {
              itemCode: "shop:item-1",
              itemName: "パンパース 肌へのいちばん 新生児",
              itemUrl: "https://example.test/item-1",
              affiliateUrl: "https://example.test/ad-1",
              itemPrice: 1980,
            },
          ],
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    await expect(
      requestRakutenProducts(
        new URL("https://openapi.rakuten.co.jp/example"),
        "secret-access-key",
        { fetchImpl, timeoutMs: 100 },
      ),
    ).resolves.toEqual([]);
  });
});
