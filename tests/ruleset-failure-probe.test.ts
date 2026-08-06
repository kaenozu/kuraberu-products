import { describe, expect, it } from "vitest";

describe("disposable required-check failure probe", () => {
  it("intentionally fails so the repository ruleset can be observed", () => {
    expect(false).toBe(true);
  });
});
