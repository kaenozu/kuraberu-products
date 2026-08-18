import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import VisualKeyDifferences from "../src/components/VisualKeyDifferences.astro";

describe("VisualKeyDifferences", () => {
  it("renders no common note by default in VisualKeyDifferences", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(VisualKeyDifferences, {
      props: {
        leftLabel: "商品A",
        rightLabel: "商品B",
        items: [{ label: "重量", left: "200g", right: "260g" }],
      },
    });

    expect(html).not.toContain("書いていない項目");
    expect(html).not.toContain("容量");
    expect(html).not.toContain("保温効力");
    expect(html).toContain("商品A");
    expect(html).toContain("商品B");
  });

  it("renders the common note only when explicitly provided", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(VisualKeyDifferences, {
      props: {
        leftLabel: "商品A",
        rightLabel: "商品B",
        items: [{ label: "重量", left: "200g", right: "260g" }],
        commonNote: "この一覧以外は両商品とも同じです。",
      },
    });

    expect(html).toContain("この一覧以外は両商品とも同じです。");
  });
});
