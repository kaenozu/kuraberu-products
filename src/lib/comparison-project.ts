export const comparisonProjectStorageKey = "kuraberu:comparison-project:v1";

export const comparisonDecisions = [
  "undecided",
  "adopted",
  "next",
  "hold",
  "excluded",
] as const;

export type ComparisonDecision = (typeof comparisonDecisions)[number];

export interface ComparisonProject {
  version: 1;
  purpose: string;
  budget: string;
  mustHave: readonly string[];
  avoid: readonly string[];
  candidateIds: readonly string[];
  decision: ComparisonDecision;
  decisionReason: string;
  unresolved: readonly string[];
}

export function createEmptyComparisonProject(): ComparisonProject {
  return {
    version: 1,
    purpose: "",
    budget: "",
    mustHave: [],
    avoid: [],
    candidateIds: [],
    decision: "undecided",
    decisionReason: "",
    unresolved: [],
  };
}

/**
 * 各テキスト項目の長さ上限。UI（src/pages/memo.astro）の maxlength と同値。
 * サニタイザー側でも強制することで、UI 経由以外の入力（localStorage 直書き等）
 * も同一の上限で切り詰める。文字数は maxlength と同じく UTF-16 コード単位で、
 * NFKC 正規化・トリム後の値に適用する。
 */
export const comparisonProjectTextLimits = {
  purpose: 300,
  budget: 100,
  mustHave: 500,
  avoid: 500,
  decisionReason: 500,
  unresolved: 500,
} as const;

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.normalize("NFKC").trim().slice(0, maxLength)
    : "";
}

function cleanList(value: unknown, itemMaxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    const text = cleanText(item, itemMaxLength);
    if (text && !result.includes(text)) result.push(text);
  }
  return result;
}

export function sanitizeComparisonProject(
  raw: string | null,
  knownCandidateIds: readonly string[],
): ComparisonProject {
  const empty = createEmptyComparisonProject();
  if (!raw) return empty;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return empty;
    const candidate = parsed as Record<string, unknown>;
    if (candidate.version !== 1) return empty;
    const allowedIds = new Set(knownCandidateIds);
    const candidateIds = cleanList(
      candidate.candidateIds,
      comparisonProjectTextLimits.mustHave,
    ).filter((id) => allowedIds.has(id));
    const decision = comparisonDecisions.includes(
      candidate.decision as ComparisonDecision,
    )
      ? (candidate.decision as ComparisonDecision)
      : empty.decision;
    return {
      version: 1,
      purpose: cleanText(
        candidate.purpose,
        comparisonProjectTextLimits.purpose,
      ),
      budget: cleanText(candidate.budget, comparisonProjectTextLimits.budget),
      mustHave: cleanList(
        candidate.mustHave,
        comparisonProjectTextLimits.mustHave,
      ),
      avoid: cleanList(candidate.avoid, comparisonProjectTextLimits.avoid),
      candidateIds,
      decision,
      decisionReason: cleanText(
        candidate.decisionReason,
        comparisonProjectTextLimits.decisionReason,
      ),
      unresolved: cleanList(
        candidate.unresolved,
        comparisonProjectTextLimits.unresolved,
      ),
    };
  } catch {
    return empty;
  }
}

export function encodeComparisonProject(project: ComparisonProject): string {
  return JSON.stringify({
    version: 1,
    purpose: project.purpose,
    budget: project.budget,
    mustHave: [...project.mustHave],
    avoid: [...project.avoid],
    candidateIds: [...project.candidateIds],
    decision: project.decision,
    decisionReason: project.decisionReason,
    unresolved: [...project.unresolved],
  });
}
