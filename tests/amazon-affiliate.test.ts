import { readFileSync } from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeOptionalAmazonAssociateTag,
  toAmazonAssociateSearchUrl,
  validateBuildEnvironment,
} from "../config/runtime-env.mjs";
import PurchaseCard from "../src/components/PurchaseCard.astro";

const validRakutenUrl = "https://www.rakuten.co.jp/search/thermos-jnl-s500";

describe("Amazon Associates integration", () => {
  beforeEach(() => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "");
    vi.stubEnv("PUBLIC_AMAZON_ASSOCIATE_TAG", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes an optional tracking ID and rejects malformed values", () => {
    expect(normalizeOptionalAmazonAssociateTag(undefined)).toBeUndefined();
    expect(normalizeOptionalAmazonAssociateTag("   ")).toBeUndefined();
    expect(normalizeOptionalAmazonAssociateTag(" example-22 ")).toBe(
      "example-22",
    );
    expect(() => normalizeOptionalAmazonAssociateTag("bad tag-22")).toThrow(
      /ASCII letters, digits, or hyphens/,
    );
    expect(() => normalizeOptionalAmazonAssociateTag("bad&tag-22")).toThrow(
      /ASCII letters, digits, or hyphens/,
    );
  });

  it("builds an Amazon.co.jp search link with the tracking ID", () => {
    const value = toAmazonAssociateSearchUrl(
      " サーモス JNL-S500 ",
      "example-22",
    );
    expect(value).toBeDefined();

    const url = new URL(value!);
    expect(url.origin).toBe("https://www.amazon.co.jp");
    expect(url.pathname).toBe("/s");
    expect(url.searchParams.get("k")).toBe("サーモス JNL-S500");
    expect(url.searchParams.get("tag")).toBe("example-22");
  });

  it("keeps Amazon optional in build validation but validates a configured tag", () => {
    expect(
      validateBuildEnvironment({ DEPLOYMENT_ENV: "preview" })
        .amazonAssociateTag,
    ).toBeUndefined();
    expect(
      validateBuildEnvironment({
        DEPLOYMENT_ENV: "preview",
        PUBLIC_AMAZON_ASSOCIATE_TAG: "example-22",
      }).amazonAssociateTag,
    ).toBe("example-22");
    expect(() =>
      validateBuildEnvironment({
        DEPLOYMENT_ENV: "preview",
        PUBLIC_AMAZON_ASSOCIATE_TAG: "example 22",
      }),
    ).toThrow(/PUBLIC_AMAZON_ASSOCIATE_TAG/);
  });

  it("renders a tracked sponsored Amazon CTA only for a verified purchase card", async () => {
    vi.stubEnv("PUBLIC_AMAZON_ASSOCIATE_TAG", "example-22");
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "サーモス JNL-S500",
        audience: "軽さを優先する人向け",
        href: validRakutenUrl,
        productId: "thermos-jnl-s500",
        placement: "article-end",
        purchaseLinkStatus: "verified",
      },
    });

    expect(html).toContain("Amazonで商品を確認");
    expect(html).toContain("tag=example-22");
    expect(html).toContain('rel="sponsored nofollow noopener noreferrer"');
    expect(html).toContain('data-amazon-cta="purchase"');
    expect(html).toContain('data-product-id="thermos-jnl-s500"');
    expect(html).toContain('data-placement="article-end"');
    expect(html).toContain("（広告）");
  });

  it("suppresses the Amazon CTA when purchaseLinkStatus is unverified (#549)", async () => {
    vi.stubEnv("PUBLIC_AMAZON_ASSOCIATE_TAG", "example-22");
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "サーモス JNL-S500",
        audience: "軽さを優先する人向け",
        href: validRakutenUrl,
        productId: "thermos-jnl-s500",
        purchaseLinkStatus: "unverified",
      },
    });

    // H-3 (#549) で unverified / unavailable 時は CTA を一切表示しない
    // (楽天・アマゾン両方とも抑制) ため、Amazon CTA もレンダリングされない。
    expect(html).not.toContain("Amazonで商品を確認");
    expect(html).not.toContain("data-amazon-cta=");
  });

  it("tracks Amazon without changing the strict core CTA count contract", () => {
    const purchaseCardSource = readFileSync(
      "src/components/PurchaseCard.astro",
      "utf8",
    );
    const amazonCtaStart = purchaseCardSource.indexOf("amazon-purchase-link");
    const amazonCtaEnd = purchaseCardSource.indexOf(
      ">\n          Amazon",
      amazonCtaStart,
    );
    const amazonCtaSource = purchaseCardSource.slice(
      amazonCtaStart,
      amazonCtaEnd,
    );
    expect(amazonCtaSource).toContain('data-amazon-cta="purchase"');
    expect(amazonCtaSource).not.toContain("data-cta-event");

    const beaconSource = readFileSync("public/click-beacon.js", "utf8");
    expect(beaconSource).toContain("[data-cta-event], [data-amazon-cta]");
    expect(beaconSource).toContain(
      "cta.dataset.ctaEvent || cta.dataset.amazonCta",
    );
    expect(beaconSource).toContain("linkType: linkType(cta)");
    expect(beaconSource).toContain('return "direct-rakuten"');
    expect(beaconSource).toContain('return "affiliate-rakuten"');
  });

  it("keeps the required Associates identification statement on the shared layout", () => {
    const source = readFileSync("src/layouts/BaseLayout.astro", "utf8");
    expect(source).toContain("PUBLIC_AMAZON_ASSOCIATE_TAG?.trim()");
    expect(source).toContain(
      "Amazonのアソシエイトとして、{site.name}は適格販売により収入を得ています。",
    );
  });
});
