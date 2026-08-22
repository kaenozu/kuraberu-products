import { existsSync, readFileSync } from "node:fs";
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

  it("allows same-origin scripts without 'unsafe-inline' in script-src", () => {
    const headers = readFileSync("public/_headers", "utf8");
    const csp = headers.match(/Content-Security-Policy:\s*(.+)/)?.[1] ?? "";
    const scriptSrc = csp.match(/script-src\s+([^;]+)/)?.[1] ?? "";
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });
});

describe("CSP-compatible comparison table fallback", () => {
  it("loads the fallback from an external script instead of inline JavaScript", () => {
    const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
    expect(layout).toContain(
      '<script is:inline src="/comparison-table-labels.js" defer></script>',
    );
    expect(layout).not.toContain("labelComparisonTables");
    expect(readFileSync("public/comparison-table-labels.js", "utf8")).toContain(
      "labelComparisonTables",
    );
  });

  it("provides the comparison-table-labels.js build artifact", () => {
    expect(existsSync("public/comparison-table-labels.js")).toBe(true);
    const content = readFileSync("public/comparison-table-labels.js", "utf8");
    expect(content).toContain("labelComparisonTables");
    expect(content).toContain("data-label");
    expect(content).toContain("DOMContentLoaded");
  });

  it("retains the defer attribute on the external script tag", () => {
    const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
    expect(layout).toMatch(
      /<script[^>]*\ssrc="\/comparison-table-labels\.js"[^>]*\sdefer[^>]*>/,
    );
  });

  it("does not depend on inline JavaScript body in BaseLayout", () => {
    const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
    const markerIdx = layout.indexOf("marker: comparison-card-labels");
    expect(markerIdx).toBeGreaterThan(-1);
    const afterMarker = layout.substring(markerIdx);
    expect(afterMarker).not.toMatch(/<script is:inline>\s*\(/);
    expect(afterMarker).toContain(
      '<script is:inline src="/comparison-table-labels.js" defer></script>',
    );
  });

  it("generates HTML that references the external script when build output exists", ({
    skip,
  }) => {
    if (!existsSync("dist")) {
      // dist が無い環境（単体テスト実行など）では黙って成功させず、
      // 理由をログに出して明示的にスキップする。
      console.warn(
        "skip: dist/ が存在しないため実ビルドHTMLの検証をスキップしました（astro build 後に再実行してください）",
      );
      skip();
    }
    const html = readFileSync("dist/index.html", "utf8");
    expect(html).toContain("comparison-table-labels.js");
    expect(html).toMatch(
      /<script[^>]*\ssrc="[^"]*comparison-table-labels\.js"/,
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

  it("drops candidates without a valid itemPrice instead of defaulting to price 0", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            items: [
              {
                itemCode: "shop:no-price",
                itemName: "パンパース 肌へのいちばん 新生児",
                itemUrl: "https://item.rakuten.co.jp/shop/no-price",
                // itemPrice 欠損
              },
              {
                itemCode: "shop:null-price",
                itemName: "パンパース さらさらケア 新生児",
                itemUrl: "https://item.rakuten.co.jp/shop/null-price",
                itemPrice: null,
              },
              {
                itemCode: "shop:ok",
                itemName: "パンパース きれいな水色 新生児",
                itemUrl: "https://item.rakuten.co.jp/shop/ok",
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

    // price:0 の候補を生成せず、欠損候補は除外される（fail-closed）
    expect(products.map((product) => product.id)).toEqual(["shop:ok"]);
    expect(products[0]?.price).toBe(1980);
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
