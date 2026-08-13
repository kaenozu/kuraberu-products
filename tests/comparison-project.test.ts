import { describe, expect, it } from "vitest";
import {
  comparisonProjectStorageKey,
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
});
