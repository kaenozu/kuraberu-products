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
