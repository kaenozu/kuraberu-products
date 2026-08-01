import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  parseRakutenProducts,
  selectRakutenProduct,
  type RakutenProduct,
} from "../src/lib/rakuten";

const read = (path: string) => readFileSync(path, "utf8");

describe("Issue #2 editorial comparison UI", () => {
  it("keeps both products identifiable on the homepage card", () => {
    const homepage = read("src/pages/index.astro");
    expect(homepage).toContain("肌へのいちばん");
    expect(homepage).toContain("さらさらケア");
    expect(homepage).toContain("product-pair");
    expect(homepage).toContain("/articles/pampers-newborn/");
  });

  it("uses the three issue-specific comparison components in the article", () => {
    const article = read("src/pages/articles/pampers-newborn/index.astro");
    expect(article).toContain("ThirtySecondComparison");
    expect(article).toContain("DifferenceList");
    expect(article).toContain('id="comparison-details"');

    const status = read("src/components/VerificationStatus.astro");
    expect(status).toContain("公式確認済み");
    expect(status).toContain("販売ページ確認");
    expect(status).toContain("口コミ不足");
    expect(status).toContain("未確認");
  });
});

describe("product search parsing", () => {
  it("parses flat and nested item shapes", () => {
    const flat = parseRakutenProducts({
      items: [
        {
          itemCode: "shop:item-1",
          itemName: "パンパース 肌へのいちばん 新生児 66枚",
          itemUrl: "https://item.rakuten.co.jp/shop/item-1",
          affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/ad-1",
          itemPrice: 1980,
        },
      ],
    });
    const nested = parseRakutenProducts({
      Items: [
        {
          Item: {
            itemCode: "shop:item-2",
            itemName: "パンパース さらさらケア 新生児",
            itemUrl: "https://item.rakuten.co.jp/shop/item-2",
            itemPrice: "1280",
          },
        },
      ],
    });

    expect(flat[0]).toMatchObject({ id: "shop:item-1", price: 1980 });
    expect(nested[0]).toMatchObject({ id: "shop:item-2", price: 1280 });
  });

  it("requires all product terms and prefers a tracked URL", () => {
    const products: RakutenProduct[] = [
      {
        id: "wrong-line",
        name: "パンパース さらさらケア 新生児",
        url: "https://item.rakuten.co.jp/shop/wrong",
        affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/wrong-ad",
        price: 1000,
      },
      {
        id: "premium-basic",
        name: "パンパース 肌へのいちばん 新生児",
        url: "https://item.rakuten.co.jp/shop/basic",
        price: 2000,
      },
      {
        id: "premium-tracked",
        name: "パンパース　肌へのいちばん　新生児 66枚",
        url: "https://item.rakuten.co.jp/shop/tracked",
        affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/tracked-ad",
        price: 2100,
      },
    ];

    expect(
      selectRakutenProduct(products, ["パンパース", "肌へのいちばん", "新生児"])
        ?.id,
    ).toBe("premium-tracked");
    expect(
      selectRakutenProduct(products, ["パンパース", "おやすみパンツ"]),
    ).toBeUndefined();
  });

  it("drops products and affiliate URLs from unapproved hosts", () => {
    expect(
      parseRakutenProducts({
        items: [
          {
            itemCode: "shop:item-1",
            itemName: "パンパース 肌へのいちばん 新生児",
            itemUrl: "https://example.test/item-1",
            affiliateUrl: "https://example.test/ad-1",
            itemPrice: 1980,
          },
        ],
      }),
    ).toEqual([]);
  });
});
