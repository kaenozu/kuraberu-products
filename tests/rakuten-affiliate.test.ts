import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isAffiliateRakutenUrl,
  toAffiliateRakutenSearchUrl,
  toAffiliateRakutenUrl,
} from "../config/runtime-env.mjs";
import { rakutenAffiliateSearchUrl } from "../src/lib/rakuten-affiliate";
// 重いレジストリは収集時に静的importする。テスト内の動的 import は高負荷の
// フルランで 5 秒タイムアウトを起こすため（動的 import 自体の問題ではない）。
import { articlePurchaseLinks } from "../src/lib/products";
import { hairDryerProducts } from "../src/data/products/hair-dryers";

const DEFAULT_ID = "34e76967.d5cc3ae1.34e76968.3eade5e6";

function envWith(overrides: Record<string, string | undefined>) {
  return { ...process.env, ...overrides };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toAffiliateRakutenSearchUrl / toAffiliateRakutenUrl (#387)", () => {
  it("builds the redirect from the current default affiliate ID when the env var is unset", () => {
    const url = toAffiliateRakutenSearchUrl(
      "EH-NA9M",
      envWith({ RAKUTEN_AFFILIATE_ID: "" }),
    );
    expect(url).toBe(
      `https://hb.afl.rakuten.co.jp/hgc/${DEFAULT_ID}/?pc=${encodeURIComponent(
        "https://search.rakuten.co.jp/search/mall/EH-NA9M",
      )}&link_type=text`,
    );
    expect(isAffiliateRakutenUrl(url!)).toBe(true);
  });

  it("throws in production when the affiliate ID is missing instead of baking in the default", () => {
    expect(() =>
      toAffiliateRakutenSearchUrl(
        "EH-NA9M",
        envWith({ DEPLOYMENT_ENV: "production", RAKUTEN_AFFILIATE_ID: "" }),
      ),
    ).toThrow(/RAKUTEN_AFFILIATE_ID/);
  });

  it("throws in production when the affiliate ID is malformed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() =>
      toAffiliateRakutenUrl(
        "https://search.rakuten.co.jp/search/mall/F-YHVX120",
        undefined,
        envWith({
          DEPLOYMENT_ENV: "production",
          RAKUTEN_AFFILIATE_ID: "not-an-affiliate-id",
        }),
      ),
    ).toThrow(/RAKUTEN_AFFILIATE_ID/);
    expect(warn).not.toHaveBeenCalled();
  });

  it("prefers RAKUTEN_AFFILIATE_ID when it is a well-formed affiliate ID", () => {
    const custom = "0123456789abcdef.01234567.fedcba9876543210.89abcdef";
    const url = toAffiliateRakutenUrl(
      "https://search.rakuten.co.jp/search/mall/F-YHVX120",
      undefined,
      envWith({ RAKUTEN_AFFILIATE_ID: custom }),
    );
    expect(url).toContain(`https://hb.afl.rakuten.co.jp/hgc/${custom}/?pc=`);
  });

  it("falls back to the default ID with a warning when the env var is malformed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const url = toAffiliateRakutenSearchUrl("EH-NA9M", {
      ...process.env,
      RAKUTEN_AFFILIATE_ID: "not-an-affiliate-id",
    });
    expect(url).toContain(`/hgc/${DEFAULT_ID}/?pc=`);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("passes already-affiliate and non-Rakuten URLs through unchanged", () => {
    const short = "https://a.r10.to/hPl2PS";
    expect(toAffiliateRakutenUrl(short, undefined, {})).toBe(short);
    const other = "https://example.com/item";
    expect(toAffiliateRakutenUrl(other, undefined, {})).toBe(other);
    expect(toAffiliateRakutenSearchUrl("   ", {})).toBeUndefined();
  });

  it("exposes a throwing wrapper for product data modules", () => {
    expect(rakutenAffiliateSearchUrl("EH-NA9M")).toContain("/hgc/");
    expect(() => rakutenAffiliateSearchUrl("")).toThrow(/affiliate URL/);
  });

  it("keeps every generated purchase link in the registry on approved Rakuten hosts", () => {
    for (const entry of Object.values(articlePurchaseLinks) as {
      purchaseUrl: string;
    }[]) {
      expect(entry.purchaseUrl).not.toMatch(/search\.rakuten\.co\.jp/);
      expect(entry.purchaseUrl).not.toContain("<");
      expect(entry.purchaseUrl).not.toContain("<");
    }
    for (const product of hairDryerProducts) {
      for (const link of product.purchaseLinks) {
        if (link.provider !== "rakuten") continue;
        expect(isAffiliateRakutenUrl(link.url)).toBe(true);
      }
    }
  });

  it("rejects search-result destinations even when wrapped by Rakuten affiliate URLs (#436)", () => {
    for (const [key, entry] of Object.entries(articlePurchaseLinks) as [
      string,
      { purchaseUrl: string },
    ][]) {
      // #436 fail-closed: 未設定（検索リンク廃止で空）のエントリは CTA を
      // レンダリングしないため、URL 検査の対象外。
      if (!entry.purchaseUrl) continue;
      const url = new URL(entry.purchaseUrl);
      const destination =
        url.hostname === "hb.afl.rakuten.co.jp"
          ? url.searchParams.get("pc")
          : entry.purchaseUrl;

      expect(destination, key).toBeTruthy();
      expect(destination, key).not.toMatch(
        /^https?:\/\/search\.rakuten\.co\.jp\//,
      );
      if (url.hostname === "hb.afl.rakuten.co.jp") {
        expect(destination, key).toMatch(
          /^https:\/\/item\.rakuten\.co\.jp\/[^/]+\/[^/?#]+\/?(?:[?#].*)?$/,
        );
      } else {
        // 不透明ショートリンク（a.r10.to）は到達先検証ができないため禁止。
        expect(url.hostname, key).toBe("item.rakuten.co.jp");
      }
    }
  });
});
