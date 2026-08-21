import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globalCss = readFileSync("src/styles/global.css", "utf8");
const accessibilityCss = readFileSync("src/styles/accessibility.css", "utf8");
const layoutSafetyCss = readFileSync("src/styles/layout-safety.css", "utf8");
const baseLayout = readFileSync("src/layouts/BaseLayout.astro", "utf8");

describe("full-bleed section layout regression", () => {
  it("keeps the wrap centering contract", () => {
    expect(globalCss).toMatch(
      /\.wrap\s*\{[^}]*margin-inline:\s*auto;/s,
    );
    expect(layoutSafetyCss).toMatch(
      /\.section:nth-of-type\(even\)\s*\{[^}]*margin-inline:\s*auto;/s,
    );
    expect(layoutSafetyCss).toMatch(/padding-inline:\s*0;/);
  });

  it("extends the background without widening document scrollWidth", () => {
    expect(layoutSafetyCss).toMatch(
      /box-shadow:\s*0 0 0 100vmax var\(--section-alt\);/,
    );
    expect(layoutSafetyCss).toMatch(/clip-path:\s*inset\(0 -100vmax\);/);
  });

  it("loads the safety override after global styles", () => {
    const globalImport = baseLayout.indexOf("../styles/global.css");
    const accessibilityImport = baseLayout.indexOf("../styles/accessibility.css");

    expect(globalImport).toBeGreaterThanOrEqual(0);
    expect(accessibilityImport).toBeGreaterThan(globalImport);
    expect(accessibilityCss).toMatch(
      /^@import\s+["']\.\/layout-safety\.css["'];/,
    );
  });
});
