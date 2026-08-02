import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createCssUsageReport } from "../scripts/report-css-usage.mjs";

const temporaryRoots: string[] = [];

function createProject(css: string, source: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "css-usage-"));
  temporaryRoots.push(root);
  fs.mkdirSync(path.join(root, "src", "styles"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "styles", "global.css"), css);
  fs.writeFileSync(path.join(root, "src", "page.astro"), source);
  return root;
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("CSS usage report", () => {
  it("marks exact class references as used", () => {
    const root = createProject(
      ".used-card { display: block; } .unused-card { display: none; }",
      '<article class="used-card">content</article>',
    );

    const report = createCssUsageReport({ root });

    expect(report.selectorCount).toBe(2);
    expect(report.unused.map((selector) => selector.className)).toEqual([
      "unused-card",
    ]);
  });

  it("does not treat a longer class name as an exact token match", () => {
    const root = createProject(
      ".section-heading { display: flex; } .subsection-heading { display: grid; }",
      '<h2 class="subsection-heading">heading</h2>',
    );

    const report = createCssUsageReport({ root });

    expect(report.unused.map((selector) => selector.className)).toEqual([
      "section-heading",
    ]);
  });

  it("protects known runtime-generated classes", () => {
    const root = createProject(
      ".status-official { color: green; } .product-premium { color: teal; } .external-embed-x { display: block; }",
      "<p>no literal dynamic class names</p>",
    );

    const report = createCssUsageReport({ root });

    expect(report.unused).toEqual([]);
    expect(report.selectors.every((selector) => selector.dynamic)).toBe(true);
  });
});
