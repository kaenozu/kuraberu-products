import { describe, expect, it } from "vitest";
import { collectSelectedRules } from "../src/domain/diagnosis/score";
import type { DiagnosisRule } from "../src/domain/diagnosis/types";

/**
 * Issue #561 整理の回帰テスト。
 * - `collectSelectedRules` が `exclusionsByQuestion` を質問単位でグルーピングして返す。
 * - `exclusions` フラット版と `exclusionsByQuestion` の内容が一貫している。
 */

const tag = (value: string) =>
  ({ field: "tags", operator: "includes", value }) as const;

const makeQuestion = (
  id: string,
  options: { id: string; rules: DiagnosisRule[] }[],
) => ({ id, options });

describe("collectSelectedRules exclusionsByQuestion (#561)", () => {
  it("groups exclude rules by questionId", () => {
    const questions = [
      makeQuestion("q1", [
        {
          id: "exclude-glass",
          rules: [
            {
              type: "exclude",
              reasonCode: "GLASS",
              match: tag("ガラス"),
            },
          ],
        },
      ]),
      makeQuestion("q2", [
        {
          id: "exclude-plastic",
          rules: [
            {
              type: "exclude",
              reasonCode: "PLASTIC",
              match: tag("プラスチック"),
            },
          ],
        },
      ]),
    ];
    const result = collectSelectedRules(questions, {
      q1: "exclude-glass",
      q2: "exclude-plastic",
    });
    expect(Object.keys(result.exclusionsByQuestion).sort()).toEqual([
      "q1",
      "q2",
    ]);
    expect(result.exclusionsByQuestion.q1).toHaveLength(1);
    expect(result.exclusionsByQuestion.q1?.[0]?.reasonCode).toBe("GLASS");
    expect(result.exclusionsByQuestion.q2?.[0]?.reasonCode).toBe("PLASTIC");
    expect(result.exclusions).toHaveLength(2);
  });

  it("does not add empty entries for questions without exclusions", () => {
    const questions = [
      makeQuestion("q1", [
        {
          id: "score-only",
          rules: [{ type: "score", score: 1, reasonCode: "OK" }],
        },
      ]),
    ];
    const result = collectSelectedRules(questions, { q1: "score-only" });
    expect(result.exclusionsByQuestion).toEqual({});
    expect(result.exclusions).toEqual([]);
  });

  it("flattens multiple exclude rules within the same question", () => {
    const questions = [
      makeQuestion("q1", [
        {
          id: "multi",
          rules: [
            { type: "exclude", reasonCode: "A", match: tag("A") },
            { type: "exclude", reasonCode: "B", match: tag("B") },
          ],
        },
      ]),
    ];
    const result = collectSelectedRules(questions, { q1: "multi" });
    expect(result.exclusionsByQuestion.q1).toHaveLength(2);
    expect(
      result.exclusionsByQuestion.q1?.map((e) => e.reasonCode).sort(),
    ).toEqual(["A", "B"]);
  });

  it("skips unanswered questions in exclusionsByQuestion", () => {
    const questions = [
      makeQuestion("q1", [
        {
          id: "exclude",
          rules: [{ type: "exclude", reasonCode: "X", match: tag("X") }],
        },
      ]),
      makeQuestion("q2", [
        {
          id: "another",
          rules: [{ type: "exclude", reasonCode: "Y", match: tag("Y") }],
        },
      ]),
    ];
    const result = collectSelectedRules(questions, { q1: "exclude" });
    expect(result.exclusionsByQuestion.q1).toHaveLength(1);
    expect(result.exclusionsByQuestion.q2).toBeUndefined();
  });
});
