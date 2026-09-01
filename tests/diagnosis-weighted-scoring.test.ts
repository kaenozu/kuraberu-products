import { describe, expect, it } from "vitest";
import { runDiagnosis } from "../src/domain/diagnosis/engine";
import type {
  DiagnosisConfig,
  DiagnosisQuestion,
  Product,
} from "../src/domain/diagnosis/types";

// ---- テスト用フィクスチャ ----

const productA: Product = {
  id: "prod-a",
  categoryId: "test",
  brand: "テスト",
  name: "商品 A",
  tags: ["tag-a"],
  attributes: { capacity: 100, material: "ppsu" },
  articleUrls: ["/articles/test/"],
  purchaseLinks: [],
  sources: [
    { label: "公式", url: "https://example.com", checkedAt: "2026-01-01" },
  ],
  verifiedAt: "2026-01-01",
};

const productB: Product = {
  id: "prod-b",
  categoryId: "test",
  brand: "テスト",
  name: "商品 B",
  tags: ["tag-b"],
  attributes: { capacity: 200, material: "glass" },
  articleUrls: ["/articles/test/"],
  purchaseLinks: [],
  sources: [
    { label: "公式", url: "https://example.com", checkedAt: "2026-01-01" },
  ],
  verifiedAt: "2026-01-01",
};

const allProducts = [productA, productB];

// ---- テスト用診断設定（weight なし: 既定動作） ----

const questionsNoWeight: DiagnosisQuestion[] = [
  {
    id: "q1",
    type: "boolean",
    label: "質問1",
    required: true,
    options: [
      {
        id: "yes",
        label: "はい",
        rules: [
          {
            type: "score",
            match: {
              field: "attributes",
              key: "capacity",
              operator: "eq",
              value: 100,
            },
            score: 3,
            reasonCode: "Q1_YES",
          },
        ],
      },
    ],
  },
  {
    id: "q2",
    type: "boolean",
    label: "質問2",
    required: false,
    options: [
      {
        id: "yes",
        label: "はい",
        rules: [
          {
            type: "score",
            match: {
              field: "attributes",
              key: "capacity",
              operator: "eq",
              value: 100,
            },
            score: 2,
            reasonCode: "Q2_YES",
          },
        ],
      },
    ],
  },
];

const configNoWeight: DiagnosisConfig = {
  id: "test-no-weight",
  categoryId: "test",
  categoryLabel: "テスト",
  title: "テスト",
  description: "テスト",
  productIds: ["prod-a", "prod-b"],
  questions: questionsNoWeight,
  tieBreaker: [{ type: "attribute", key: "capacity", direction: "asc" }],
  resultConfig: { topHeadingTemplate: "{productName}", disclaimer: "テスト" },
};

// ---- テスト用診断設定（weight あり） ----

const questionsWithWeight: DiagnosisQuestion[] = [
  {
    id: "q1",
    type: "boolean",
    label: "質問1（重い）",
    required: true,
    weight: 3,
    options: [
      {
        id: "yes",
        label: "はい",
        rules: [
          {
            type: "score",
            match: {
              field: "attributes",
              key: "capacity",
              operator: "eq",
              value: 100,
            },
            score: 2,
            reasonCode: "Q1_YES",
          },
        ],
      },
    ],
  },
  {
    id: "q2",
    type: "boolean",
    label: "質問2（軽い）",
    required: false,
    weight: 1,
    options: [
      {
        id: "yes",
        label: "はい",
        rules: [
          {
            type: "score",
            match: {
              field: "attributes",
              key: "capacity",
              operator: "eq",
              value: 100,
            },
            score: 2,
            reasonCode: "Q2_YES",
          },
        ],
      },
    ],
  },
];

const configWithWeight: DiagnosisConfig = {
  id: "test-with-weight",
  categoryId: "test",
  categoryLabel: "テスト",
  title: "テスト",
  description: "テスト",
  productIds: ["prod-a", "prod-b"],
  questions: questionsWithWeight,
  tieBreaker: [{ type: "attribute", key: "capacity", direction: "asc" }],
  resultConfig: { topHeadingTemplate: "{productName}", disclaimer: "テスト" },
};

// ---- テスト ----

describe("weighted scoring", () => {
  it("weight なし（既定=1）: スコアに影響しない", () => {
    // q1 のみ回答: score 3 × weight 1 = 3
    const result = runDiagnosis(configNoWeight, allProducts, { q1: "yes" });
    const prodA = result.rankedProducts.find((e) => e.productId === "prod-a")!;
    expect(prodA.score).toBe(3);
  });

  it("weight=3 の質問に回答: スコアが3倍になる", () => {
    // q1 のみ回答: score 2 × weight 3 = 6
    const result = runDiagnosis(configWithWeight, allProducts, { q1: "yes" });
    const prodA = result.rankedProducts.find((e) => e.productId === "prod-a")!;
    expect(prodA.score).toBe(6);
  });

  it("weight=3 + weight=1 の両方回答: 重み付き加算", () => {
    // q1: 2 × 3 = 6, q2: 2 × 1 = 2 → 合計 8
    const result = runDiagnosis(configWithWeight, allProducts, {
      q1: "yes",
      q2: "yes",
    });
    const prodA = result.rankedProducts.find((e) => e.productId === "prod-a")!;
    expect(prodA.score).toBe(8);
  });

  it("weight なし設定と比較: weight がある方がスコア差が広がる", () => {
    const noWeight = runDiagnosis(configNoWeight, allProducts, {
      q1: "yes",
      q2: "yes",
    });
    const withWeight = runDiagnosis(configWithWeight, allProducts, {
      q1: "yes",
      q2: "yes",
    });
    const prodA_noWeight = noWeight.rankedProducts.find(
      (e) => e.productId === "prod-a",
    )!;
    const prodA_withWeight = withWeight.rankedProducts.find(
      (e) => e.productId === "prod-a",
    )!;
    // weight なし: 3 + 2 = 5, weight あり: 6 + 2 = 8
    expect(prodA_withWeight.score).toBeGreaterThan(prodA_noWeight.score);
  });

  it("weight=1 は既定値と同じ動作", () => {
    // weight=1 の設定で weight なしと同じ結果になることを確認する
    const questionsWeightOne: DiagnosisQuestion[] = [
      {
        id: "q1",
        type: "boolean",
        label: "質問1",
        required: true,
        weight: 1,
        options: [
          {
            id: "yes",
            label: "はい",
            rules: [
              {
                type: "score",
                match: {
                  field: "attributes",
                  key: "capacity",
                  operator: "eq",
                  value: 100,
                },
                score: 3,
                reasonCode: "Q1_YES",
              },
            ],
          },
        ],
      },
    ];
    const configWeightOne: DiagnosisConfig = {
      ...configNoWeight,
      questions: questionsWeightOne,
    };
    const resultNoWeight = runDiagnosis(configNoWeight, allProducts, {
      q1: "yes",
    });
    const resultWeightOne = runDiagnosis(configWeightOne, allProducts, {
      q1: "yes",
    });
    expect(resultWeightOne.rankedProducts).toEqual(
      resultNoWeight.rankedProducts,
    );
  });

  it("weight は exclude ルールに影響しない", () => {
    const questionsWithExclude: DiagnosisQuestion[] = [
      {
        id: "q1",
        type: "boolean",
        label: "除外質問",
        required: true,
        weight: 5,
        options: [
          {
            id: "yes",
            label: "はい",
            rules: [
              {
                type: "exclude",
                match: {
                  field: "attributes",
                  key: "material",
                  operator: "eq",
                  value: "glass",
                },
                reasonCode: "EXCLUDED",
              },
            ],
          },
        ],
      },
    ];
    const configWithExclude: DiagnosisConfig = {
      ...configNoWeight,
      questions: questionsWithExclude,
    };
    const result = runDiagnosis(configWithExclude, allProducts, { q1: "yes" });
    // productB (glass) は除外される（weight にかかわらず）
    expect(result.excludedProducts.map((e) => e.productId)).toContain("prod-b");
    expect(result.rankedProducts.map((e) => e.productId)).not.toContain(
      "prod-b",
    );
  });

  it("未回答の質問は weight が適用されない", () => {
    // q1 のみ回答、q2 はスキップ
    const result = runDiagnosis(configWithWeight, allProducts, { q1: "yes" });
    const prodA = result.rankedProducts.find((e) => e.productId === "prod-a")!;
    // q1: 2 × 3 = 6（q2 は回答なし）
    expect(prodA.score).toBe(6);
  });

  it("reasonCode は重み適用後でも正しく記録される", () => {
    const result = runDiagnosis(configWithWeight, allProducts, { q1: "yes" });
    const prodA = result.rankedProducts.find((e) => e.productId === "prod-a")!;
    expect(prodA.positiveReasons).toContain("Q1_YES");
  });
});
