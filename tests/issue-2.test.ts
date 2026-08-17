import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  parseRakutenProducts,
  selectRakutenProduct,
  type RakutenProduct,
} from "../src/lib/rakuten";

const read = (path: string) => readFileSync(path, "utf8");

describe("Issue #2 editorial comparison UI", () => {
  it("keeps articles discoverable from the homepage", () => {
    const homepage = read("src/pages/index.astro");
    expect(homepage).toContain("publicArticleMetadata");
    expect(homepage).toContain("/articles/");
    expect(homepage).toContain("比較記事");
  });

  it("uses the canonical comparison shell in the article", () => {
    const article = read("src/pages/articles/pampers-newborn/index.astro");
    expect(article).toContain("ArticleComparisonV2");
    expect(article).toContain("ArticleSocialProof");
    expect(article).not.toContain("DifferenceList");
    expect(article).toContain('href="#key-differences"');
    expect(article).toContain('href="#decision-guide"');
    // 確認状態の表示は TrustLine（✓ 公式確認済み（日付）・広告を含みます）に統一されている。
    const shell = read("src/components/ArticleComparisonV2.astro");
    expect(shell).toContain("TrustLine");
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

  it("requires all product terms and does not prefer a tracked URL", () => {
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
      selectRakutenProduct(products, [
        "パンパース",
        "肌へのいちばん",
        "新生児",
      ]),
    ).toBeUndefined();
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

  it("passes typed fail-closed selection criteria from each CTA query", () => {
    const button = read("src/components/AffiliateButton.astro");
    expect(button).toContain("type ProductQuery");
    expect(button).toContain(
      "const productQueries: Record<ProductId, ProductQuery>",
    );
    expect(button).toContain("selection:");
    expect(button).toMatch(
      /selectRakutenProduct\(await fetchRakutenProducts\(query\.keyword\), query\.requiredTerms, query\.selection\)/,
    );
  });
});
