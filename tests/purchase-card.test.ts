import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import PurchaseCard from "../src/components/PurchaseCard.astro";

const validRakutenUrl = "https://www.rakuten.co.jp/search/thermos-jnl-s500";

describe("PurchaseCard", () => {
  it("renders name, audience, CTA label, and note", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "サーモス JNL-S500",
        audience: "軽さ・コンパクト・食洗機対応を優先する人向け",
        href: validRakutenUrl,
        productId: "thermos-jnl-s500",
        imagePath: "/products/thermos-jnl-s500.jpg",
        placement: "after-decision",
        note: "価格・在庫は販売先でご確認ください。",
      },
    });

    expect(html).toContain("サーモス JNL-S500");
    expect(html).toContain("軽さ・コンパクト・食洗機対応を優先する人向け");
    expect(html).toContain("楽天市場で型番を確認");
    expect(html).toContain("商品ページを確認する");
    expect(html).toContain("（広告）");
    expect(html).toContain("価格・在庫は販売先でご確認ください。");
    expect(html).toContain('data-placement="after-decision"');
    expect(html).toContain('rel="sponsored nofollow noopener noreferrer"');
  });

  it("marks a verified affiliate URL as sponsored advertising", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "パンパース 肌へのいちばん",
        audience: "肌へのやさしさを優先する人向け",
        href: "https://hb.afl.rakuten.co.jp/ichiba/affiliate-example",
        productId: "pampers-premium-newborn",
      },
    });

    expect(html).toContain("楽天市場で型番を確認");
    expect(html).toContain("商品ページを確認する");
    expect(html).toContain("（広告）");
    expect(html).toContain('rel="sponsored nofollow noopener noreferrer"');
  });

  it("marks a Rakuten short URL as sponsored advertising", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "ベビービョルン バウンサー Bliss",
        audience: "公式商品ページを確認したい人向け",
        href: "https://a.r10.to/h5dAQI",
        productId: "babybjorn-bouncer-bliss",
      },
    });

    expect(html).toContain("楽天市場で型番を確認");
    expect(html).toContain("（広告）");
    expect(html).toContain('rel="sponsored nofollow noopener noreferrer"');
  });

  it("defaults to article-end placement (v3 principle) and renders image", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "タイガー MTA-J050",
        audience: "保冷力を優先する人向け",
        href: validRakutenUrl,
        imagePath: "/products/tiger-mta-j050.jpg",
      },
    });

    expect(html).toContain("タイガー MTA-J050");
    expect(html).toContain('data-placement="article-end"');
    expect(html).toContain('src="/products/tiger-mta-j050.jpg"');
  });

  it("supports article-end placement", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "タイガー MTA-J050",
        audience: "保冷力を優先する人向け",
        href: validRakutenUrl,
        placement: "article-end",
      },
    });

    expect(html).toContain('data-placement="article-end"');
  });
});
