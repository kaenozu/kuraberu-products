import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ComparisonHero from "../src/components/ComparisonHero.astro";
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

describe("ComparisonHero", () => {
  it("renders condition lines, difference count, anchor, and trust line", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ComparisonHero, {
      props: {
        lines: [
          {
            condition: "軽さ・食洗機を重視する",
            brand: "サーモス",
            model: "JNL-S500",
          },
          {
            condition: "保冷力・ハンドルを重視する",
            brand: "タイガー",
            model: "MTA-J050",
          },
        ],
        differences: [
          { label: "軽さ", note: "約60g差" },
          { label: "カラー", note: "12色 vs 4色" },
        ],
        diffAnchor: "#key-differences",
        checkedAt: "2026-08-12",
      },
    });

    expect(html).toContain("軽さ・食洗機を重視する →");
    expect(html).toContain("サーモス JNL-S500");
    expect(html).toContain("大きな違いは2つ");
    expect(html).toContain("約60g差");
    expect(html).toContain('href="#key-differences"');
    expect(html).toContain("違いを詳しく見る");
    expect(html).toContain("公式情報確認済み · 2026-08-12");
  });

  it("omits trust line when checkedAt is not provided", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ComparisonHero, {
      props: {
        lines: [{ condition: "A向き", brand: "甲", model: "X" }],
        differences: [{ label: "価格" }],
        diffAnchor: "#diffs",
      },
    });

    expect(html).not.toContain("公式情報確認済み");
    expect(html).toContain("大きな違いは1つ");
  });
});
