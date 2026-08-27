import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeAmazonAssociateTag,
  toAmazonAssociateSearchUrl,
  validateBuildEnvironment,
} from "../config/runtime-env.mjs";
import PurchaseCard from "../src/components/PurchaseCard.astro";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Amazon associate configuration", () => {
  it("is disabled when the tracking id is empty", () => {
    expect(normalizeAmazonAssociateTag(undefined)).toBeUndefined();
    expect(toAmazonAssociateSearchUrl("Panasonic SR-M10B", "")).toBeUndefined();
  });

  it("builds an encoded amazon.co.jp search URL with the tracking id", () => {
    const value = toAmazonAssociateSearchUrl(
      "象印 NW-YB10 ホワイト",
      "kuraberu-22",
    );
    const url = new URL(value!);

    expect(url.origin).toBe("https://www.amazon.co.jp");
    expect(url.pathname).toBe("/s");
    expect(url.searchParams.get("k")).toBe("象印 NW-YB10 ホワイト");
    expect(url.searchParams.get("tag")).toBe("kuraberu-22");
  });

  it("rejects malformed tracking ids during environment validation", () => {
    expect(() =>
      validateBuildEnvironment({
        DEPLOYMENT_ENV: "preview",
        PUBLIC_AMAZON_ASSOCIATE_TAG: "bad tag&x=1",
      }),
    ).toThrow(/PUBLIC_AMAZON_ASSOCIATE_TAG/);
  });
});

describe("PurchaseCard Amazon CTA", () => {
  it("renders only for verified products and carries advertising + analytics attributes", async () => {
    vi.stubEnv("PUBLIC_AMAZON_ASSOCIATE_TAG", "kuraberu-22");
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "");

    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "Panasonic SR-M10B",
        audience: "比較して選びたい人向け",
        href: "https://www.rakuten.co.jp/search/sr-m10b",
        productId: "panasonic-sr-m10b",
        placement: "article-end",
        purchaseLinkStatus: "verified",
      },
    });

    expect(html).toContain("Amazonで商品を確認");
    expect(html).toContain("https://www.amazon.co.jp/s?");
    expect(html).toContain("tag=kuraberu-22");
    expect(html).toContain('rel="sponsored nofollow noopener noreferrer"');
    expect(html).toContain('data-cta-event="purchase"');
    expect(html).toContain('data-product-id="panasonic-sr-m10b"');
    expect(html).toContain('data-placement="article-end"');
    expect(html).toContain(
      "Amazonのアソシエイトとして、くらべる商品メモは適格販売により収入を得ています。",
    );
  });

  it("stays fail-closed for unverified products", async () => {
    vi.stubEnv("PUBLIC_AMAZON_ASSOCIATE_TAG", "kuraberu-22");
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "Panasonic SR-M10B",
        audience: "比較して選びたい人向け",
        productId: "panasonic-sr-m10b",
        purchaseLinkStatus: "unverified",
      },
    });

    expect(html).not.toContain("Amazonで商品を確認");
    expect(html).toContain("購入リンクは現在確認中です。");
  });
});
