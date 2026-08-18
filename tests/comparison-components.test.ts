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

  it("flips bar proportions when lower values are better", async () => {
    const container = await AstroContainer.create();
    const render = (direction?: "higher-is-better" | "lower-is-better") =>
      container.renderToString(VisualKeyDifferences, {
        props: {
          leftLabel: "商品A",
          rightLabel: "商品B",
          items: [
            {
              label: "重量",
              left: "200g",
              right: "260g",
              highlight: "left",
              bar: { left: 200, right: 260 },
              ...(direction ? { direction } : {}),
            },
          ],
        },
      });

    const widths = (html: string) =>
      [...html.matchAll(/style="width:([\d.]+)%"/g)].map((match) =>
        Number(match[1]),
      );

    // 既定（higher-is-better）: 値が大きい側（260g）のバーが長い
    const [defaultLeft, defaultRight] = widths(await render());
    expect(defaultLeft).toBeLessThan(defaultRight);

    // lower-is-better: 軽い側（200g）のバーが長くなる
    const [flippedLeft, flippedRight] = widths(await render("lower-is-better"));
    expect(flippedLeft).toBeGreaterThan(flippedRight);
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
