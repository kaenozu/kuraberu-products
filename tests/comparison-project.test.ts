import { describe, expect, it } from "vitest";
import {
  comparisonProjectStorageKey,
  comparisonProjectTextLimits,
  createEmptyComparisonProject,
  encodeComparisonProject,
  sanitizeComparisonProject,
  type ComparisonProject,
} from "../src/lib/comparison-project";

describe("comparison project", () => {
  const knownIds = ["pampers-newborn", "merries-newborn"];

  it("creates an empty MVP project with safe defaults", () => {
    expect(createEmptyComparisonProject()).toEqual({
      version: 1,
      purpose: "",
      budget: "",
      mustHave: [],
      avoid: [],
      candidateIds: [],
      decision: "undecided",
      decisionReason: "",
      unresolved: [],
    });
  });

  it("rejects corrupt data and removes unknown candidate ids", () => {
    expect(sanitizeComparisonProject(null, knownIds)).toEqual(
      createEmptyComparisonProject(),
    );
    expect(sanitizeComparisonProject("not-json", knownIds)).toEqual(
      createEmptyComparisonProject(),
    );
    expect(
      sanitizeComparisonProject(
        JSON.stringify({
          version: 1,
          purpose: " 夜用 ",
          candidateIds: [knownIds[0], knownIds[0], "removed"],
          decision: "invalid",
          mustHave: [" 幅 640mm以下 ", ""],
          avoid: ["香り"],
          unresolved: ["店舗確認"],
        }),
        knownIds,
      ),
    ).toEqual({
      version: 1,
      purpose: "夜用",
      budget: "",
      mustHave: ["幅 640mm以下"],
      avoid: ["香り"],
      candidateIds: [knownIds[0]],
      decision: "undecided",
      decisionReason: "",
      unresolved: ["店舗確認"],
    });
  });

  it("round-trips the project fields and uses a versioned key", () => {
    const project: ComparisonProject = {
      version: 1,
      purpose: "毎日使う",
      budget: "20,000円以内",
      mustHave: ["Android対応"],
      avoid: ["月額契約"],
      candidateIds: [knownIds[1]],
      decision: "next",
      decisionReason: "価格差を確認する",
      unresolved: ["保証期間"],
    };
    expect(comparisonProjectStorageKey).toBe("kuraberu:comparison-project:v1");
    expect(
      sanitizeComparisonProject(encodeComparisonProject(project), knownIds),
    ).toEqual(project);
  });

  it("keeps text exactly at the UI maxlength limits", () => {
    const raw = JSON.stringify({
      version: 1,
      purpose: "あ".repeat(comparisonProjectTextLimits.purpose),
      budget: "い".repeat(comparisonProjectTextLimits.budget),
      mustHave: ["う".repeat(comparisonProjectTextLimits.mustHave)],
    });
    const project = sanitizeComparisonProject(raw, knownIds);
    expect(project.purpose).toHaveLength(comparisonProjectTextLimits.purpose);
    expect(project.budget).toHaveLength(comparisonProjectTextLimits.budget);
    expect(project.mustHave[0]).toHaveLength(
      comparisonProjectTextLimits.mustHave,
    );
    // 上限ちょうどの入力は round-trip しても変わらない。
    expect(
      sanitizeComparisonProject(encodeComparisonProject(project), knownIds),
    ).toEqual(project);
  });

  it("truncates over-limit text to the UI maxlength values", () => {
    const raw = JSON.stringify({
      version: 1,
      purpose: `${"あ".repeat(301)}x`,
      budget: `${"い".repeat(101)}y`,
      decisionReason: `${"う".repeat(501)}z`,
      mustHave: [
        `${"か".repeat(500)}Z`, // 501 文字 → 末尾を切り詰め、次項目と重複扱いになる
        "か".repeat(500),
      ],
      unresolved: ["", "   ", "保持される項目"],
    });
    const project = sanitizeComparisonProject(raw, knownIds);

    expect(project.purpose).toBe(
      "あ".repeat(comparisonProjectTextLimits.purpose),
    );
    expect(project.budget).toBe(
      "い".repeat(comparisonProjectTextLimits.budget),
    );
    expect(project.decisionReason).toBe(
      "う".repeat(comparisonProjectTextLimits.decisionReason),
    );
    // リスト項目も項目ごとに上限が適用され、重複除去は切り詰め後の値で行われる。
    expect(project.mustHave).toEqual([
      "か".repeat(comparisonProjectTextLimits.mustHave),
    ]);
    expect(project.unresolved).toEqual(["保持される項目"]);
  });
});
