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

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.normalize("NFKC").trim() : "";
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    const text = cleanText(item);
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
    const candidateIds = cleanList(candidate.candidateIds).filter((id) =>
      allowedIds.has(id),
    );
    const decision = comparisonDecisions.includes(
      candidate.decision as ComparisonDecision,
    )
      ? (candidate.decision as ComparisonDecision)
      : empty.decision;
    return {
      version: 1,
      purpose: cleanText(candidate.purpose),
      budget: cleanText(candidate.budget),
      mustHave: cleanList(candidate.mustHave),
      avoid: cleanList(candidate.avoid),
      candidateIds,
      decision,
      decisionReason: cleanText(candidate.decisionReason),
      unresolved: cleanList(candidate.unresolved),
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
