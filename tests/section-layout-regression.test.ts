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
