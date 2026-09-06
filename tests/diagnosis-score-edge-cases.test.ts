import { describe, expect, it } from "vitest";
import {
  selectedOptionIds,
  collectSelectedRules,
} from "../src/domain/diagnosis/score";

/**
 * Issue #562 のテストギャップ補充。
 * - `QuestionType: "number"` の `selectedOptionIds` 戻り値が常に `[]` であることを
 *   仕様として固定する。
 * - `collectSelectedRules` の `questionWeights` が未回答質問でも記録される仕様を
 *   明示する。
 */

describe("selectedOptionIds (#562)", () => {
  it("returns [] for undefined answer", () => {
    expect(selectedOptionIds(undefined)).toEqual([]);
  });

  it('returns ["true"] for boolean true', () => {
    expect(selectedOptionIds(true)).toEqual(["true"]);
  });

  it('returns ["false"] for boolean false', () => {
    expect(selectedOptionIds(false)).toEqual(["false"]);
  });

  it("returns the string for single string answer", () => {
    expect(selectedOptionIds("option-1")).toEqual(["option-1"]);
  });

  it("returns trimmed string for whitespace-padded answer", () => {
    expect(selectedOptionIds("  option-2  ")).toEqual(["option-2"]);
  });

  it("returns [] for empty string", () => {
    expect(selectedOptionIds("")).toEqual([]);
  });

  it("returns the array for multi answer", () => {
    expect(selectedOptionIds(["a", "b"])).toEqual(["a", "b"]);
  });

  it("returns [] for number answer (QuestionType number is unimplemented, #561)", () => {
    expect(selectedOptionIds(42)).toEqual([]);
    expect(selectedOptionIds(0)).toEqual([]);
    expect(selectedOptionIds(-1.5)).toEqual([]);
  });
});

describe("collectSelectedRules questionWeights (#562)", () => {
  const question = (
    id: string,
    weight?: number,
    options?: { id: string; rules: never[] }[],
  ) => ({
    id,
    weight,
    options: options ?? [],
  });

  it("records weight=1 for unanswered questions", () => {
    const { questionWeights } = collectSelectedRules(
      [question("q1", 2), question("q2"), question("q3", 0.5)],
      {},
    );
    expect(questionWeights).toEqual({ q1: 2, q2: 1, q3: 0.5 });
  });

  it("records weights even when answers are empty", () => {
    const { questionWeights, rulesByQuestion } = collectSelectedRules(
      [question("q1"), question("q2")],
      {},
    );
    expect(questionWeights).toEqual({ q1: 1, q2: 1 });
    expect(rulesByQuestion).toEqual({});
  });
});
