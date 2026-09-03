import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

test("full-bleed section layout stays centered", () => {
  const global = read("src/styles/global.css");
  const safety = read("src/styles/layout-safety.css");
  const access = read("src/styles/accessibility.css");
  const base = read("src/layouts/BaseLayout.astro");

  expect(global).toContain("margin-inline: auto;");
  expect(safety).toContain("margin-inline: auto;");
  expect(safety).toContain("padding-inline: 0;");
  expect(safety).toContain("100vmax var(--section-alt)");
  expect(safety).toContain("inset(0 -100vmax)");
  expect(access).toContain('@import "./layout-safety.css";');

  const globalAt = base.indexOf("../styles/global.css");
  const accessAt = base.indexOf("../styles/accessibility.css");
  expect(accessAt).toBeGreaterThan(globalAt);
});

test("subsection headings stack vertically on every page", () => {
  const global = read("src/styles/global.css");

  const rule = global.match(/\.subsection-heading \{[^}]*\}/s)?.[0] ?? "";
  expect(rule).not.toBe("");
  expect(rule).toContain("flex-direction: column;");
  expect(rule).toContain("align-items: flex-start;");
});

test("top section headings align with the featured card column", () => {
  const page = read("src/pages/index.astro");

  expect(page).toContain("[data-top-latest] .subsection-heading");
  expect(page).toContain("[data-top-categories] .subsection-heading");
  expect(page).toContain("[data-top-diagnosis] .subsection-heading");
  expect(page).toContain("max-width: 900px;");
});
