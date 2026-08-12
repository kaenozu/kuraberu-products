export const verificationStatuses = [
  "official",
  "retailer",
  "insufficient",
  "unverified",
] as const;

export type VerificationStatus = (typeof verificationStatuses)[number];
export type CandidateTone = "premium" | "standard";

export interface ComparisonCandidate {
  product: string;
  line: string;
  tone: CandidateTone;
  audience: string;
  note: string;
  status?: VerificationStatus | string;
  /** 商品画像パス（30秒比較カード等に表示） */
  image?: string;
  imageAlt?: string;
}

export interface ComparisonRow {
  label: string;
  left: string;
  right: string;
  /** 決め手となる値を持つ側を強調表示する（left | right） */
  highlight?: "left" | "right" | null;
  /** 強調セルに添える一言（例: 「約60g軽い」「保冷力が高い」） */
  highlightNote?: string;
}

export interface DifferenceRow extends ComparisonRow {
  leftStatus?: VerificationStatus | string;
  rightStatus?: VerificationStatus | string;
}

const statusLabels: Record<VerificationStatus, string> = {
  official: "公式確認済み",
  retailer: "販売ページ確認",
  insufficient: "口コミ不足",
  unverified: "未確認",
};

export function normalizeVerificationStatus(
  status: unknown,
): VerificationStatus {
  return typeof status === "string" &&
    verificationStatuses.includes(status as VerificationStatus)
    ? (status as VerificationStatus)
    : "unverified";
}

export function verificationStatusLabel(status: unknown): string {
  return statusLabels[normalizeVerificationStatus(status)];
}

export function normalizeIdPrefix(
  value: unknown,
  fallback = "comparison",
): string {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  const safeFallback =
    fallback
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "comparison";

  const candidate = normalized || safeFallback;
  return /^[a-z_]/.test(candidate) ? candidate : `comparison-${candidate}`;
}
