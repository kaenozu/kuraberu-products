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

/**
 * 比較テーブルの1行。
 * HeroComparison・VisualKeyDifferences 等の共通コンポーネントで使う。
 * 検証ステータス（出典の信頼性）を持たない場合に使う。
 */
export interface ComparisonRow {
  label: string;
  left: string;
  right: string;
  /** 決め手となる値を持つ側を強調表示する（left | right） */
  highlight?: "left" | "right" | null;
  /** 強調セルに添える一言（例: 「約60g軽い」「保冷力が高い」） */
  highlightNote?: string;
}

/**
 * 検証ステータス付きの比較テーブル行。
 * 左右それぞれの出典確認状態（official / retailer / unverified 等）を
 * 表示する必要がある記事の詳細比較テーブルで使う。
 */
export interface DifferenceRow extends ComparisonRow {
  /** 左側の検証ステータス */
  leftStatus?: VerificationStatus | string;
  /** 右側の検証ステータス */
  rightStatus?: VerificationStatus | string;
}
