import { describe, expect, it } from "vitest";
import {
  buttonDisabled,
  hasAnswer,
  buildProgressText,
  buildNextButtonText,
  computeVisibleProducts,
  buildResultCardData,
  buildArticleLinkData,
  buildPurchaseLinkData,
  PROVIDER_LABELS,
} from "../src/lib/diagnosis-ui";
import type {
  DiagnosisResult,
  Product,
  PurchaseLink,
  RankedProduct,
} from "../src/domain/diagnosis/types";

const baseProduct: Product = {
  id: "test-product",
  categoryId: "test",
  brand: "テスト",
  name: "テスト商品 A",
  tags: ["tag-a"],
  attributes: {},
  articleUrls: ["/articles/test-article/"],
  purchaseLinks: [
    { provider: "rakuten", url: "https://a.r10.to/test", affiliate: true },
  ],
  sources: [],
  verifiedAt: "2026-01-01",
};

const baseResult: DiagnosisResult = {
  categoryId: "test",
  rankedProducts: [
    {
      productId: "test-product",
      rank: 1,
      score: 10,
      positiveReasons: ["reason-a", "reason-b"],
      cautions: ["caution-x"],
    },
  ],
  excludedProducts: [],
  answeredQuestionCount: 3,
};

describe("buttonDisabled", () => {
  it("required + no answer → disabled", () => {
    expect(buttonDisabled(true, false)).toBe(true);
  });

  it("required + has answer → enabled", () => {
    expect(buttonDisabled(true, true)).toBe(false);
  });

  it("optional + no answer → enabled", () => {
    expect(buttonDisabled(false, false)).toBe(false);
  });

  it("optional + has answer → enabled", () => {
    expect(buttonDisabled(false, true)).toBe(false);
  });
});

describe("hasAnswer", () => {
  it("undefined → false", () => {
    expect(hasAnswer(undefined)).toBe(false);
  });

  it("null → false", () => {
    expect(hasAnswer(null as unknown as undefined)).toBe(false);
  });

  it("empty string → false", () => {
    expect(hasAnswer("")).toBe(false);
  });

  it("whitespace-only string → false", () => {
    expect(hasAnswer("  ")).toBe(false);
  });

  it("non-empty string → true", () => {
    expect(hasAnswer("yes")).toBe(true);
  });

  it("number → true", () => {
    expect(hasAnswer(42)).toBe(true);
  });

  it("zero → true", () => {
    expect(hasAnswer(0)).toBe(true);
  });

  it("boolean true → true", () => {
    expect(hasAnswer(true)).toBe(true);
  });

  it("boolean false → true", () => {
    expect(hasAnswer(false)).toBe(true);
  });

  it("empty array → false", () => {
    expect(hasAnswer([])).toBe(false);
  });

  it("non-empty array → true", () => {
    expect(hasAnswer(["a"])).toBe(true);
  });
});

describe("buildProgressText", () => {
  it("first question", () => {
    expect(buildProgressText(0, 5)).toBe("1 / 5 問目");
  });

  it("last question", () => {
    expect(buildProgressText(4, 5)).toBe("5 / 5 問目");
  });

  it("single question", () => {
    expect(buildProgressText(0, 1)).toBe("1 / 1 問目");
  });
});

describe("buildNextButtonText", () => {
  it("returns 次へ for non-final questions", () => {
    expect(buildNextButtonText(0, 5)).toBe("次へ");
    expect(buildNextButtonText(3, 5)).toBe("次へ");
  });

  it("returns 結果を見る for the final question", () => {
    expect(buildNextButtonText(4, 5)).toBe("結果を見る");
  });

  it("single question is immediately final", () => {
    expect(buildNextButtonText(0, 1)).toBe("結果を見る");
  });
});

describe("computeVisibleProducts", () => {
  it("returns up to 4 products by default", () => {
    const manyProducts: RankedProduct[] = Array.from(
      { length: 10 },
      (_, i) => ({
        productId: `p${i}`,
        rank: i + 1,
        score: 10 - i,
        positiveReasons: [],
        cautions: [],
      }),
    );
    const result: DiagnosisResult = {
      categoryId: "test",
      rankedProducts: manyProducts,
      excludedProducts: [],
      answeredQuestionCount: 3,
    };
    expect(computeVisibleProducts(result)).toHaveLength(4);
    expect(computeVisibleProducts(result)[0].productId).toBe("p0");
  });

  it("returns all products when fewer than 4", () => {
    const result: DiagnosisResult = {
      ...baseResult,
      rankedProducts: [
        {
          productId: "p1",
          rank: 1,
          score: 10,
          positiveReasons: [],
          cautions: [],
        },
        {
          productId: "p2",
          rank: 2,
          score: 8,
          positiveReasons: [],
          cautions: [],
        },
      ],
    };
    expect(computeVisibleProducts(result)).toHaveLength(2);
  });

  it("respects custom maxCount", () => {
    const result: DiagnosisResult = {
      ...baseResult,
      rankedProducts: Array.from({ length: 5 }, (_, i) => ({
        productId: `p${i}`,
        rank: i + 1,
        score: 10 - i,
        positiveReasons: [],
        cautions: [],
      })),
    };
    expect(computeVisibleProducts(result, 2)).toHaveLength(2);
  });
});

describe("buildResultCardData", () => {
  const reasons: Record<string, string> = {
    "reason-a": "理由Aの表示文言",
    "reason-b": "理由Bの表示文言",
    "caution-x": "注意Xの表示文言",
  };

  it("builds top product card data", () => {
    const entry = baseResult.rankedProducts[0];
    const data = buildResultCardData(baseProduct, entry, 0, reasons);

    expect(data.rankLabel).toBe("おすすめ");
    expect(data.cardClass).toBe("diagnosis-card diagnosis-card--top");
    expect(data.reasons).toEqual(["理由Aの表示文言", "理由Bの表示文言"]);
    expect(data.cautions).toEqual(["注意Xの表示文言"]);
    expect(data.topCautionHtml).toContain("気になる点");
    expect(data.topCautionHtml).toContain("・注意Xの表示文言");
    expect(data.caseText).toBe("");
  });

  it("builds runner-up card data", () => {
    const entry: RankedProduct = {
      productId: "test-product",
      rank: 2,
      score: 8,
      positiveReasons: ["reason-a"],
      cautions: ["caution-x"],
    };
    const data = buildResultCardData(baseProduct, entry, 1, reasons);

    expect(data.rankLabel).toBe("2位");
    expect(data.cardClass).toBe("diagnosis-card");
    expect(data.topCautionHtml).toBe("");
    expect(data.caseText).toBe("注意Xの表示文言");
  });

  it("runner-up with no cautions gets default case text", () => {
    const entry: RankedProduct = {
      productId: "test-product",
      rank: 2,
      score: 8,
      positiveReasons: [],
      cautions: [],
    };
    const data = buildResultCardData(baseProduct, entry, 1, reasons);

    expect(data.caseText).toBe("条件によってはこちらも候補になります。");
  });

  it("limits reasons and cautions to 3", () => {
    const entry: RankedProduct = {
      productId: "test-product",
      rank: 1,
      score: 10,
      positiveReasons: ["reason-a", "reason-b", "reason-a", "reason-b"],
      cautions: ["caution-x", "caution-x"],
    };
    const data = buildResultCardData(baseProduct, entry, 0, reasons);
    expect(data.reasons.length).toBeLessThanOrEqual(3);
    expect(data.cautions.length).toBeLessThanOrEqual(3);
  });

  it("includes article and purchase links", () => {
    const entry = baseResult.rankedProducts[0];
    const data = buildResultCardData(baseProduct, entry, 0, reasons);

    expect(data.articleLinks).toHaveLength(1);
    expect(data.articleLinks[0].href).toBe("/articles/test-article/");
    expect(data.articleLinks[0].label).toBe("詳しい比較を見る");

    expect(data.purchaseLinks).toHaveLength(1);
    expect(data.purchaseLinks[0].href).toBe("https://a.r10.to/test");
    expect(data.purchaseLinks[0].rel).toContain("sponsored");
  });
});

describe("buildArticleLinkData", () => {
  it("builds article link with correct dataset", () => {
    const data = buildArticleLinkData("/articles/test/", baseProduct, 2);
    expect(data.href).toBe("/articles/test/");
    expect(data.label).toBe("詳しい比較を見る");
    expect(data.dataset.productId).toBe("test-product");
    expect(data.dataset.rank).toBe("3");
    expect(data.dataset.diagnosisArticleLink).toBe("");
  });
});

describe("buildPurchaseLinkData", () => {
  const affiliateLink: PurchaseLink = {
    provider: "rakuten",
    url: "https://a.r10.to/test",
    affiliate: true,
  };

  const nonAffiliateLink: PurchaseLink = {
    provider: "official",
    url: "https://example.com/product",
    affiliate: false,
  };

  it("builds affiliate purchase link with sponsored rel", () => {
    const data = buildPurchaseLinkData(affiliateLink, baseProduct, 0);
    expect(data.href).toBe("https://a.r10.to/test");
    expect(data.target).toBe("_blank");
    expect(data.rel).toBe("sponsored nofollow noopener noreferrer");
    expect(data.label).toBe("楽天で商品を見る");
    expect(data.dataset.ctaEvent).toBe("purchase");
    expect(data.dataset.placement).toBe("diagnosis-result");
    expect(data.dataset.rank).toBe("1");
  });

  it("builds non-affiliate purchase link without sponsored", () => {
    const data = buildPurchaseLinkData(nonAffiliateLink, baseProduct, 1);
    expect(data.rel).toBe("noopener noreferrer");
    expect(data.label).toBe("公式サイトで確認する");
    expect(data.dataset.rank).toBe("2");
  });

  it("falls back to generic label for unknown provider", () => {
    const unknownLink: PurchaseLink = {
      provider: "other",
      url: "https://other.example.com",
      affiliate: false,
    };
    const data = buildPurchaseLinkData(unknownLink, baseProduct, 0);
    expect(data.label).toBe("販売ページを見る");
  });
});

describe("PROVIDER_LABELS", () => {
  it("has labels for all standard providers", () => {
    expect(PROVIDER_LABELS.rakuten).toBe("楽天で商品を見る");
    expect(PROVIDER_LABELS.amazon).toBe("Amazonで商品を見る");
    expect(PROVIDER_LABELS.official).toBe("公式サイトで確認する");
  });
});
