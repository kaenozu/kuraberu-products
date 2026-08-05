import type { VerificationStatus } from "./comparison";

export type PriorityScore = 0 | 1 | 2;
export type PriorityOutcome = "standard" | "left" | "right" | "tie" | "unknown";

export interface PriorityEvaluation {
  score?: PriorityScore;
  status: VerificationStatus;
  reason: string;
}

export interface PriorityOption {
  id: string;
  label: string;
  left: PriorityEvaluation;
  right: PriorityEvaluation;
  caution: string;
  evidenceHref: `#${string}`;
}

export interface PriorityConclusion {
  selectedId?: string;
  outcome: PriorityOutcome;
  heading: string;
  summary: string;
  reasons: readonly string[];
  caution: string;
  evidenceHref: `#${string}`;
}

export interface StandardPriorityConclusion {
  heading: string;
  summary: string;
  caution: string;
  evidenceHref: `#${string}`;
}

const isVerified = (
  evaluation: PriorityEvaluation,
): evaluation is PriorityEvaluation & { score: PriorityScore } =>
  evaluation.status === "official" && evaluation.score !== undefined;

export function resolvePriorityConclusion(
  selectedId: string | null | undefined,
  options: readonly PriorityOption[],
  labels: { left: string; right: string },
  standard: StandardPriorityConclusion,
): PriorityConclusion {
  const option = options.find((candidate) => candidate.id === selectedId);
  if (!option) {
    return {
      outcome: "standard",
      heading: standard.heading,
      summary: standard.summary,
      reasons: [],
      caution: standard.caution,
      evidenceHref: standard.evidenceHref,
    };
  }

  const reasons = [
    `${labels.left}：${option.left.reason}`,
    `${labels.right}：${option.right.reason}`,
  ];
  if (!isVerified(option.left) || !isVerified(option.right)) {
    return {
      selectedId: option.id,
      outcome: "unknown",
      heading: `${option.label}：判断材料不足`,
      summary:
        "確認済みの記事データだけでは一方を選べません。価格・在庫などは購入時点の販売ページで確認してください。",
      reasons,
      caution: option.caution,
      evidenceHref: option.evidenceHref,
    };
  }
  if (option.left.score === option.right.score) {
    return {
      selectedId: option.id,
      outcome: "tie",
      heading: `${option.label}：確認済みデータ上は同点`,
      summary:
        "この重視ポイントだけでは一方に絞れません。ほかの比較軸と実際の合いやすさも確認してください。",
      reasons,
      caution: option.caution,
      evidenceHref: option.evidenceHref,
    };
  }
  const leftWins = option.left.score > option.right.score;
  const winner = leftWins ? labels.left : labels.right;
  return {
    selectedId: option.id,
    outcome: leftWins ? "left" : "right",
    heading: `${option.label}：${winner}を先に確認`,
    summary: `記事内で公式確認済みの項目では、${winner}がこの重視ポイントに対応する機能を多く示しています。`,
    reasons,
    caution: option.caution,
    evidenceHref: option.evidenceHref,
  };
}

export function parsePriorityId(
  params: URLSearchParams,
  options: readonly PriorityOption[],
): string | undefined {
  const value = params.get("priority")?.normalize("NFKC").trim();
  return value && options.some((option) => option.id === value)
    ? value
    : undefined;
}
