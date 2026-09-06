import { describe, expect, it } from "vitest";
import { articleMetadata } from "../src/content/articles";
import {
  diagnosisCategories,
  findDiagnosisCategory,
} from "../src/data/diagnoses";
import { babyBottleProducts } from "../src/data/products/baby-bottles";
import {
  babyBottleDiagnosis,
  babyBottleReasonDictionary,
} from "../src/data/diagnoses/baby-bottle";
import { validateDiagnosisData } from "../src/domain/diagnosis/validate";

// 設定のディープコピーを作り、一部だけ書き換えた検証用 config を作る。
function clonedConfig(): typeof babyBottleDiagnosis {
  return JSON.parse(
    JSON.stringify(babyBottleDiagnosis),
  ) as typeof babyBottleDiagnosis;
}

describe("validateDiagnosisData", () => {
  it("本番の哺乳瓶データは検証を通過する", () => {
    expect(() =>
      validateDiagnosisData(
        babyBottleDiagnosis,
        babyBottleProducts,
        babyBottleReasonDictionary,
      ),
    ).not.toThrow();
  });

  it("存在しない商品IDを参照すると throw する", () => {
    const config = {
      ...babyBottleDiagnosis,
      productIds: [...babyBottleDiagnosis.productIds, "missing-product"],
    };
    expect(() =>
      validateDiagnosisData(
        config,
        babyBottleProducts,
        babyBottleReasonDictionary,
      ),
    ).toThrow(/存在しない商品/);
  });

  it("理由辞書に無い reasonCode を使うと throw する", () => {
    expect(() =>
      validateDiagnosisData(babyBottleDiagnosis, babyBottleProducts, {}),
    ).toThrow(/理由辞書/);
  });

  // ---- attributes.key の実在チェック（タイポ検出） ----

  it("ルール内 attributes.key のタイポ（capasity）を検出して throw する", () => {
    // filter.ts の neq/eq は undefined を不一致として扱うため、タイポは
    // スコア崩壊するが黙って通過してしまう。ビルド時に検出できることを保証する。
    const config = clonedConfig();
    const rule = config.questions[0].options![0].rules[0];
    if (rule.type !== "score" || rule.match?.field !== "attributes") {
      throw new Error("fixture precondition failed");
    }
    rule.match.key = "capasity"; // capacity のタイポ
    expect(() =>
      validateDiagnosisData(
        config,
        babyBottleProducts,
        babyBottleReasonDictionary,
      ),
    ).toThrow(/capasity.*存在しません/);
  });

  it("tieBreaker の属性キーのタイポも検出して throw する", () => {
    const config = clonedConfig();
    config.tieBreaker = [
      { type: "attribute", key: "capasity", direction: "asc" },
    ];
    expect(() =>
      validateDiagnosisData(
        config,
        babyBottleProducts,
        babyBottleReasonDictionary,
      ),
    ).toThrow(/tieBreaker/);
  });

  // ---- field:"tags" の値の実在チェック ----

  it('field:"tags" の value がどの商品タグにも存在しなければ throw する', () => {
    const config = clonedConfig();
    config.questions[0].options![0].rules[0] = {
      type: "score",
      match: { field: "tags", operator: "includes", value: "glss" },
      score: 2,
      reasonCode: "GLASS_CLEANING",
    };
    expect(() =>
      validateDiagnosisData(
        config,
        babyBottleProducts,
        babyBottleReasonDictionary,
      ),
    ).toThrow(/glss.*商品タグ/);
  });

  // ---- productId 参照の実在チェック ----

  it("ScoreRule.productId が存在しない商品を参照すると throw する", () => {
    const config = clonedConfig();
    config.questions[0].options![0].rules[0] = {
      type: "score",
      productId: "missing-product",
      score: 3,
    };
    expect(() =>
      validateDiagnosisData(
        config,
        babyBottleProducts,
        babyBottleReasonDictionary,
      ),
    ).toThrow(/score ルールが存在しない商品/);
  });

  it("editorialPriority.productIds が存在しない商品を参照すると throw する", () => {
    const config = clonedConfig();
    config.tieBreaker = [
      { type: "editorialPriority", productIds: ["bo160-glass", "missing"] },
    ];
    expect(() =>
      validateDiagnosisData(
        config,
        babyBottleProducts,
        babyBottleReasonDictionary,
      ),
    ).toThrow(/editorialPriority.*存在しない商品/);
  });

  // ---- purchaseLinks のホスト検証 ----

  it("楽天購入リンクが許可されたホストでなければ throw する", () => {
    const products = babyBottleProducts.map((product) =>
      product.id === "bo160-glass"
        ? {
            ...product,
            purchaseLinks: [
              {
                provider: "rakuten" as const,
                url: "https://evil.example.com/item",
                affiliate: false,
              },
            ],
          }
        : product,
    );
    expect(() =>
      validateDiagnosisData(
        babyBottleDiagnosis,
        products,
        babyBottleReasonDictionary,
      ),
    ).toThrow(/許可されたホストではありません/);
  });

  it("Amazon購入リンクが許可されたホストでなければ throw する (#558)", () => {
    const products = babyBottleProducts.map((product) =>
      product.id === "bo160-glass"
        ? {
            ...product,
            purchaseLinks: [
              {
                provider: "amazon" as const,
                url: "https://amazon.co.jp.evil.example/item",
                affiliate: false,
              },
            ],
          }
        : product,
    );
    expect(() =>
      validateDiagnosisData(
        babyBottleDiagnosis,
        products,
        babyBottleReasonDictionary,
      ),
    ).toThrow(/Amazon購入リンクが許可されたホストではありません/);
  });

  // ---- articleUrls / relatedArticles.path の実在チェック ----

  it("articleUrls が実在記事と一致すれば options を渡しても通過する", () => {
    expect(() =>
      validateDiagnosisData(
        babyBottleDiagnosis,
        babyBottleProducts,
        babyBottleReasonDictionary,
        {
          knownArticlePaths: articleMetadata.map((article) => article.path),
          pageContent: findDiagnosisCategory("baby-bottle")?.pageContent,
        },
      ),
    ).not.toThrow();
  });

  it("articleUrls が許容パス集合に無ければ throw する", () => {
    expect(() =>
      validateDiagnosisData(
        babyBottleDiagnosis,
        babyBottleProducts,
        babyBottleReasonDictionary,
        { knownArticlePaths: [] },
      ),
    ).toThrow(/articleUrls.*実在する記事パスではありません/);
  });

  it("relatedArticles.path が許容パス集合に無ければ throw する", () => {
    const category = findDiagnosisCategory("baby-bottle");
    expect(category).toBeDefined();
    expect(() =>
      validateDiagnosisData(
        babyBottleDiagnosis,
        babyBottleProducts,
        babyBottleReasonDictionary,
        {
          knownArticlePaths: articleMetadata.map((article) => article.path),
          pageContent: {
            ...category!.pageContent,
            relatedArticles: [{ path: "/articles/not-found/", label: "×" }],
          },
        },
      ),
    ).toThrow(/relatedArticles.*実在する記事パスではありません/);
  });
});

describe("diagnosisCategories レジストリ", () => {
  it("全カテゴリの実データが拡張済み検証を通過する", () => {
    // index.ts は読み込み時に検証を実行するため、ここまで import が
    // 成功している時点で fail-fast が働いている。念のため全件明示検証する。
    const knownArticlePaths = articleMetadata.map((article) => article.path);
    for (const category of diagnosisCategories) {
      expect(() =>
        validateDiagnosisData(
          category.config,
          category.products,
          category.reasons,
          { knownArticlePaths, pageContent: category.pageContent },
        ),
      ).not.toThrow();
    }
  });
});
