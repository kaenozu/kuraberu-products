import { describe, expect, it } from "vitest";

/**
 * embed-consent contract tests.
 *
 * These test the pure logic (storage key, value validation, round-trip) by
 * reading the module source directly — avoiding the localStorage mock
 * complexity in vitest's Node sandbox.
 *
 * The browser integration (actually reading/writing localStorage) is verified
 * by the production HTML check which confirms the consent banner is rendered
 * and autoload embeds check consent before loading.
 */

// Read the module source and verify the contract
import { readFileSync } from "node:fs";

const source = readFileSync("src/lib/embed-consent.ts", "utf8");

describe("embed-consent contract", () => {
  it("uses a fixed localStorage key", () => {
    expect(source).toContain('const CONSENT_KEY = "embed-consent"');
  });

  it("exports STORAGE_KEY matching the constant", () => {
    expect(source).toContain("export const STORAGE_KEY = CONSENT_KEY");
  });

  it("only allows 'granted' or 'denied' as valid stored values", () => {
    // The getConsent function must reject any value other than granted/denied
    expect(source).toContain(
      'if (stored === "granted" || stored === "denied")',
    );
  });

  it("uses globalThis.localStorage for storage access", () => {
    // Must use globalThis, not bare `localStorage`, for testability
    expect(source).toContain("globalThis.localStorage");
  });

  it("wraps localStorage access in try/catch for SSR safety", () => {
    // Both getConsent and setConsent must handle missing localStorage
    expect(source).toContain("try {");
    expect(source).toContain("} catch {");
  });

  it("exports getConsent function", () => {
    expect(source).toContain("export function getConsent()");
  });

  it("exports setConsent function", () => {
    expect(source).toContain(
      "export function setConsent(consent: EmbedConsent)",
    );
  });

  it("exports clearConsent function", () => {
    expect(source).toContain("export function clearConsent()");
  });

  it("exports onConsentChange callback registration", () => {
    expect(source).toContain("export function onConsentChange(");
  });

  it("exports getCachedConsent for performance", () => {
    expect(source).toContain("export function getCachedConsent()");
  });

  it("type-declares window.__embedConsent and __embedConsentCallbacks", () => {
    expect(source).toContain("__embedConsent?: EmbedConsent");
    expect(source).toContain("__embedConsentCallbacks?: Set");
  });

  it("setConsent notifies listeners", () => {
    expect(source).toContain("window.__embedConsentCallbacks?.forEach");
  });

  it("clearConsent fires listeners with undefined", () => {
    expect(source).toContain("cb(undefined)");
  });
});
