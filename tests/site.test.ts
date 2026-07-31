import { describe, expect, it } from "vitest";
import { site } from "../src/config/site";
describe("site config", () => {
  it("has a name and URL", () => {
    expect(site.name).toBe("くらべる商品メモ");
    expect(site.url).toMatch(/^https:\/\//);
  });
});
