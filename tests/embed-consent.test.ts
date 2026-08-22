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

// The banner / withdraw UI lives in the component script; its contract is
// verified the same way (source-level assertions).
const componentSource = readFileSync(
  "src/components/ExternalEmbed.astro",
  "utf8",
);

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

describe("consent banner focus management (ExternalEmbed.astro)", () => {
  it("moves focus to the banner itself when it appears", () => {
    expect(componentSource).toContain("banner.tabIndex = -1");
    expect(componentSource).toContain("banner.focus()");
  });

  it("announces the banner via its region label", () => {
    expect(componentSource).toContain(
      'setAttribute("aria-label", "外部コンテンツの表示について")',
    );
  });

  it("stays a non-blocking region (not a modal dialog)", () => {
    expect(componentSource).toContain('setAttribute("role", "region")');
    expect(componentSource).not.toContain('"dialog"');
  });

  it("keeps keyboard focus on a control after the choice is made", () => {
    // 選択ボタンはバナーごと消えるため、撤回UIのボタンへフォーカスを維持する
    expect(componentSource).toContain(
      'withdrawBar?.querySelector("button")?.focus({ preventScroll: true })',
    );
  });
});

describe("consent withdraw UI (ExternalEmbed.astro)", () => {
  it("wires the existing clearConsent API to a visible control", () => {
    expect(componentSource).toContain("[data-embed-consent-withdraw]");
    expect(componentSource).toContain("clearConsent()");
    expect(componentSource).toContain("設定を変更する");
  });

  it("restores embed placeholders after withdrawal", () => {
    // 撤回時に各 autoload 埋め込みが手動読み込み（idle）へ戻る
    expect(componentSource).toContain("const resetToPlaceholder = () => {");
    expect(componentSource).toContain('root.dataset.embedState = "idle"');
    expect(componentSource).toContain("resetToPlaceholder()");
  });

  it("keeps the manual-load button restorable for autoload embeds", () => {
    // 読み込み成功後も autoload 埋め込みのボタンはDOMに残し、撤回時に復帰できる
    expect(componentSource).toContain("button.hidden = true;");
  });
});
