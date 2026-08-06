import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("responsive navigation contract", () => {
  it("keeps mobile links on one line with a usable touch target", () => {
    const css = readFileSync("src/styles/global.css", "utf8");
    expect(css).toContain(".navlinks a");
    expect(css).toContain("white-space: nowrap");
    expect(css).toContain("min-height: 44px");
  });
});
