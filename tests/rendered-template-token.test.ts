import { describe, expect, it } from "vitest";
import { findUnresolvedTemplateTokens } from "../scripts/check-rendered-html.mjs";

describe("rendered template token detection", () => {
  it("does not treat a percent-encoded byte followed by a product number as a token", () => {
    expect(
      findUnresolvedTemplateTokens(
        '<a href="https://www.amazon.co.jp/s?k=%E7%A5%9E%E6%9C%AD%EF%BC%886141%E3%83%BB6142%EF%BC%89">商品</a>',
      ),
    ).toEqual([]);
  });

  it("still detects an unresolved uppercase template token", () => {
    expect(findUnresolvedTemplateTokens("<p>%PRODUCT_ID%</p>")).toEqual([
      { token: "%PRODUCT_ID%", label: "%TOKEN%" },
    ]);
  });
});
