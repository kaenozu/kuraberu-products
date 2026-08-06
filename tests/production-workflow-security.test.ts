import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("production workflow boundary", () => {
  it("does not interpolate workflow values into shell source", () => {
    const lines = readFileSync(
      ".github/workflows/deploy-production.yml",
      "utf8",
    ).split(/\r?\n/);
    let runIndent = -1;
    for (const line of lines) {
      const indent = line.match(/^\s*/)?.[0].length ?? 0;
      if (/^\s+run:\s*(?:\||>\s*)?$/.test(line)) {
        runIndent = indent;
        continue;
      }
      if (runIndent >= 0 && line.trim() && indent <= runIndent) {
        runIndent = -1;
      }
      if (runIndent >= 0 && /\$\{\{\s*(?:inputs|vars|secrets)\./.test(line)) {
        throw new Error(`unsafe interpolation in run block: ${line.trim()}`);
      }
    }
    expect(lines.join("\n")).toContain(
      "EXPECTED_SHA: ${{ inputs.expected_sha }}",
    );
  });
});
