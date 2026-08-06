import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CONFIGURED_ENVIRONMENT_VARIABLES,
  normalizeSiteUrl,
  validateBuildEnvironment,
} from "../config/runtime-env.mjs";

function exampleEnvVars(): Set<string> {
  const example = readFileSync(".env.example", "utf8");
  return new Set(
    [...example.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1]),
  );
}

const productionBase = {
  DEPLOYMENT_ENV: "production",
  PUBLIC_SITE_URL: "https://kuraberu-products.pages.dev",
  PUBLIC_BUILD_SHA: "0123456789abcdef0123456789abcdef01234567",
  PUBLIC_CONTACT_URL: "https://contact.kuraberu-products.invalid/form",
} as const;

describe("environment variable configuration", () => {
  it("documents every configured variable in .env.example and README", () => {
    const exampleVars = exampleEnvVars();
    const readme = readFileSync("README.md", "utf8");

    for (const name of CONFIGURED_ENVIRONMENT_VARIABLES) {
      expect(exampleVars.has(name), `${name} missing from .env.example`).toBe(
        true,
      );
      expect(readme, `${name} missing from README`).toContain(name);
    }
  });

  it("accepts production with both direct Rakuten URLs", () => {
    const result = validateBuildEnvironment({
      ...productionBase,
      PUBLIC_RAKUTEN_PREMIUM_URL: "https://hb.afl.rakuten.co.jp/ci/premium",
      PUBLIC_RAKUTEN_SARASARA_URL: "https://search.rakuten.co.jp/ci/sarasara",
    });

    expect(result.deploymentEnv).toBe("production");
    expect(result.buildSha).toBe(productionBase.PUBLIC_BUILD_SHA);
    expect(result.rakutenApiReady).toBe(false);
  });

  it("accepts production with a complete Rakuten API credential set", () => {
    const result = validateBuildEnvironment({
      ...productionBase,
      RAKUTEN_APPLICATION_ID: "application-id",
      RAKUTEN_ACCESS_KEY: "access-key",
      RAKUTEN_AFFILIATE_ID: "affiliate-id",
    });

    expect(result.rakutenApiReady).toBe(true);
    expect(result.buildSha).toBe(productionBase.PUBLIC_BUILD_SHA);
  });

  it("rejects production without a complete purchase-link path", () => {
    expect(() => validateBuildEnvironment(productionBase)).toThrow(
      /Production purchase links/,
    );
    expect(() =>
      validateBuildEnvironment({
        ...productionBase,
        PUBLIC_RAKUTEN_PREMIUM_URL: "https://hb.afl.rakuten.co.jp/ci/premium",
      }),
    ).toThrow(/Production purchase links/);
  });

  it("requires a production contact URL", () => {
    const { PUBLIC_CONTACT_URL: _contactUrl, ...withoutContact } =
      productionBase;
    expect(() =>
      validateBuildEnvironment({
        ...withoutContact,
        PUBLIC_RAKUTEN_PREMIUM_URL: "https://hb.afl.rakuten.co.jp/ci/premium",
        PUBLIC_RAKUTEN_SARASARA_URL: "https://search.rakuten.co.jp/ci/sarasara",
      }),
    ).toThrow(/PUBLIC_CONTACT_URL/);
  });

  it("rejects partial API credentials and unsafe public URLs", () => {
    expect(() =>
      validateBuildEnvironment({
        DEPLOYMENT_ENV: "preview",
        RAKUTEN_APPLICATION_ID: "application-id",
      }),
    ).toThrow(/configured together/);
    expect(() =>
      validateBuildEnvironment({
        DEPLOYMENT_ENV: "preview",
        PUBLIC_CONTACT_URL: "javascript:alert(1)",
      }),
    ).toThrow(/PUBLIC_CONTACT_URL/);
    expect(() =>
      validateBuildEnvironment({
        DEPLOYMENT_ENV: "preview",
        PUBLIC_RAKUTEN_PREMIUM_URL: "https://shop.example.test/item",
      }),
    ).toThrow(/approved Rakuten host/);
  });

  it("requires a root HTTPS site URL without credentials or query", () => {
    expect(normalizeSiteUrl("https://example.test/")).toBe(
      "https://example.test",
    );
    expect(() => normalizeSiteUrl("http://example.test/")).toThrow(/https/);
    expect(() => normalizeSiteUrl("https://user:pass@example.test/")).toThrow(
      /credentials/,
    );
    expect(() => normalizeSiteUrl("https://example.test/subpath")).toThrow(
      /site root/,
    );
    expect(() => normalizeSiteUrl("https://example.test/?source=test")).toThrow(
      /query or fragment/,
    );
  });
});
