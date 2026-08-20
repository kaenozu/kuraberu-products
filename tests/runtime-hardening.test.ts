import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { isAllowedRakutenUrl } from "../config/runtime-env.mjs";
import {
  requestRakutenProducts,
  RAKUTEN_API_TIMEOUT_MS,
  selectRakutenProduct,
} from "../src/lib/rakuten";

describe("public URL boundaries", () => {
  it("allows approved Rakuten hosts and rejects unrelated hosts", () => {
    expect(
      isAllowedRakutenUrl("https://hb.afl.rakuten.co.jp/hgc/example"),
    ).toBe(true);
    expect(isAllowedRakutenUrl("https://item.rakuten.co.jp/shop/item")).toBe(
      true,
    );
    expect(isAllowedRakutenUrl("https://r10.to/example")).toBe(true);
    expect(isAllowedRakutenUrl("https://example.test/item")).toBe(false);
    expect(isAllowedRakutenUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("static asset security headers", () => {
  it("defines a scoped CSP for the Workers Static Assets response", () => {
    const headers = readFileSync("public/_headers", "utf8");
    const csp = headers.match(/Content-Security-Policy:\s*(.+)/)?.[1] ?? "";

    for (const directive of [
      "default-src",
      "script-src",
      "frame-src",
      "connect-src",
      "img-src",
      "style-src",
    ]) {
      expect(csp).toContain(`${directive} `);
    }
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/(?:^|;)\s*script-src[^;]*\*/);
    expect(csp).toContain("*.image.rakuten.co.jp");
    expect(headers).toContain("X-Content-Type-Options: nosniff");
  });
});

describe("CSP-compatible comparison table fallback", () => {
  it("loads the fallback from an external script instead of inline JavaScript", () => {
    const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
    expect(layout).toContain(
      '<script is:inline src="/comparison-table-labels.js" defer></script>',
    );
    expect(layout).not.toContain("<script is:inline>\n");
    expect(readFileSync("public/comparison-table-labels.js", "utf8")).toContain(
      "labelComparisonTables",
    );
  });
});

describe("Rakuten API request", () => {
  it("matches exact product identifiers embedded in Rakuten item URLs", () => {
    expect(
      selectRakutenProduct(
        [
          {
            id: "shop:internal-id",
            name: "パンパース さらさらケア 新生児",
            url: "https://item.rakuten.co.jp/shop/1710000040/",
            price: 1980,
          },
        ],
        ["パンパース", "さらさらケア", "新生児"],
        { exactIdentifiers: ["1710000040"] },
      ),
    ).toMatchObject({ id: "shop:internal-id", price: 1980 });
  });

  it("parses an approved response without logging credentials", async () => {
    const fetchImpl = vi.fn(
      async () =>
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
    const fetchImpl = vi.fn(
      async () =>
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
