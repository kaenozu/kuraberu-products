import { describe, expect, it } from "vitest";
import { runDiagnosis } from "../src/domain/diagnosis/engine";
import {
  collectSelectedRules,
  selectedOptionIds,
} from "../src/domain/diagnosis/score";
import type { DiagnosisConfig, Product } from "../src/domain/diagnosis/types";

// Issue #561: 診断ドメインの未実装・半実装ふるまいの仕様固定テスト。
// 本体コードの変更は含まない（振る舞いは実装・文書化済み）。

const products: readonly Product[] = [
  {
    id: "a",
    categoryId: "test",
    brand: "Test",
    name: "A",
    tags: ["light"],
    attributes: {},
    articleUrls: [],
    purchaseLinks: [],
    sources: [],
    verifiedAt: "2026-09-01",
  },
  {
    id: "b",
    categoryId: "test",
    brand: "Test",
    name: "B",
    tags: [],
    attributes: {},
    articleUrls: [],
    purchaseLinks: [],
    sources: [],
    verifiedAt: "2026-09-01",
  },
];

function configWithWeight(weight?: number): DiagnosisConfig {
  return {
    id: "test",
    categoryId: "test",
    categoryLabel: "テスト",
    title: "テスト診断",
    description: "テスト",
    productIds: ["a", "b"],
    questions: [
      {
        id: "q1",
        type: "single",
        label: "Q1",
        required: true,
        weight,
        options: [
          {
            id: "yes",
            label: "はい",
            rules: [{ type: "score", score: 3, reasonCode: "R1" }],
          },
        ],
      },
    ],
    resultConfig: { topHeadingTemplate: "{productName}", disclaimer: "" },
  };
}

describe("diagnosis #561 behaviors", () => {
  it("multiplies rule scores by the question weight", () => {
    const weighted = runDiagnosis(configWithWeight(2), products, {
      q1: "yes",
    });
    const plain = runDiagnosis(configWithWeight(undefined), products, {
      q1: "yes",
    });
    const scoreOf = (result: ReturnType<typeof runDiagnosis>, id: string) =>
      result.rankedProducts.find((entry) => entry.productId === id)?.score;
    expect(scoreOf(weighted, "a")).toBe(6);
    expect(scoreOf(plain, "a")).toBe(3);
    // 無条件ルールは全商品に適用されるため、b も weight 倍される
    expect(scoreOf(weighted, "b")).toBe(6);
    expect(scoreOf(plain, "b")).toBe(3);
  });

  it("groups exclusions by question", () => {
    const config = configWithWeight(undefined);
    config.questions[0].options = [
      {
        id: "yes",
        label: "はい",
        rules: [
          {
            type: "exclude",
            match: { field: "tags", operator: "includes", value: "light" },
            reasonCode: "NO_LIGHT",
          },
        ],
      },
    ];
    const { exclusions, exclusionsByQuestion } = collectSelectedRules(
      config.questions,
      { q1: "yes" },
    );
    expect(exclusions).toHaveLength(1);
    expect(Object.keys(exclusionsByQuestion)).toEqual(["q1"]);
    expect(exclusionsByQuestion.q1[0].reasonCode).toBe("NO_LIGHT");
  });

  it("excludes number answers from the answered count", () => {
    const config = configWithWeight(undefined);
    config.questions.push({
      id: "qnum",
      type: "number",
      label: "QN",
      required: false,
    });
    const result = runDiagnosis(config, products, { q1: "yes", qnum: 5 });
    expect(result.answeredQuestionCount).toBe(1);
    expect(selectedOptionIds(5)).toEqual([]);
  });

  it("maps boolean answers to true/false option ids", () => {
    expect(selectedOptionIds(true)).toEqual(["true"]);
    expect(selectedOptionIds(false)).toEqual(["false"]);
    expect(selectedOptionIds("yes")).toEqual(["yes"]);
  });

  it("skips score accumulation for excluded products", () => {
    const config = configWithWeight(undefined);
    config.questions[0].options = [
      {
        id: "yes",
        label: "はい",
        rules: [
          {
            type: "exclude",
            match: { field: "tags", operator: "includes", value: "light" },
            reasonCode: "NO_LIGHT",
          },
          { type: "score", score: 3, reasonCode: "R1" },
        ],
      },
    ];
    const result = runDiagnosis(config, products, { q1: "yes" });
    // 除外された a はランキングに現れず、b だけが残る
    expect(result.excludedProducts).toEqual([
      { productId: "a", reasonCode: "NO_LIGHT" },
    ]);
    expect(result.rankedProducts.map((entry) => entry.productId)).toEqual([
      "b",
    ]);
  });
});
