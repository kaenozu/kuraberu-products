/**
 * ArticleComparisonV2（比較シェル）の記事別データレジストリ（単一情報源）
 *
 * src/pages/articles/<slug>/index.astro の frontmatter に直書きされていた
 * V2 シェル（HeroComparison / VisualKeyDifferences / NextStepBlock / TrustLine）
 * の props を articleId で引けるように集約したもの。
 *
 * - 購入URLは lib/products.ts の articlePurchaseLinks（キー "<articleId>:left|right"）
 *   から解決し、ページ側の直書きをなくす
 * - 公式URL（officialHref）もこのレジストリに定義する。ただし spec-claims /
 *   official-links の各ソース検査（ページファイル内の公式URLリテラルを抽出する）
 *   との整合を保つため、ページ側にも同じ URL リテラルを1行だけ残す。
 *   両者の一致は tests/comparison-v2-registry.test.ts が検証する
 * - 確認日（checkedAt）・購入リンク状態（purchaseLinkStatus）はモノリス
 *   articles.ts のメタデータから解決する。かつて purchaseLinkStatus を
 *   渡していなかったページ（panasonic-es-lt4b-vs-es-lv7j /
 *   yamajitsu-film-holder-242286-vs-242287）もメタデータ上 verified のため、
 *   常に渡しても出力は変わらない
 *
 * defineArticleMetadata と同じく、定義時に検証して失敗させます（fail-fast）。
 */
import {
  articlePurchaseLinks,
  type ArticlePurchaseLink,
} from "../../../lib/products";
import { articleMetadata } from "../../articles";
import type { ComparisonRow, ComparisonSide } from "../types";

/** ComparisonSide のエイリアス（互換性のため残置）。 */
export type ComparisonV2Side = ComparisonSide;

/** 記事ページから宣言する比較シェルデータ。 */
export interface ComparisonV2EntryInput {
  left: ComparisonV2Side;
  right: ComparisonV2Side;
  /** 主な違い（VisualKeyDifferences の行）。少なくとも1行必須。 */
  rows: readonly ComparisonRow[];
  /** 診断カテゴリページURL（省略時は診断一覧） */
  diagnosisHref?: string;
  /** 「この一覧以外は両商品とも同じ」の注記 */
  commonNote?: string;
}

/** 解決済みの比較シェルデータ（購入URLとメタデータ解決結果を含む）。 */
export interface ComparisonV2Entry {
  readonly articleId: string;
  readonly left: Readonly<ComparisonV2Side>;
  readonly right: Readonly<ComparisonV2Side>;
  readonly rows: readonly ComparisonRow[];
  readonly diagnosisHref?: string;
  readonly commonNote?: string;
  /** articlePurchaseLinks の "<articleId>:left|right" から解決した購入URL */
  readonly purchaseHrefs: Readonly<{ left: string; right: string }>;
  /** モノリスメタデータの productInfoCheckedAt */
  readonly checkedAt?: string;
  /** モノリスメタデータの purchaseLinkStatus */
  readonly purchaseLinkStatus:
    "verified" | "direct" | "unverified" | "unavailable";
}

const purchaseLinkIndex = new Map<string, ArticlePurchaseLink>(
  Object.entries(articlePurchaseLinks),
);

const requireSideText = (side: ComparisonV2Side, label: string): void => {
  for (const [field, value] of [
    ["brand", side.brand],
    ["line", side.line],
    ["tagline", side.tagline],
    ["image", side.image],
    ["imageAlt", side.imageAlt],
    ["officialHref", side.officialHref],
  ] as const) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new TypeError(
        `comparisonV2: ${label}.${field} must be a non-empty string`,
      );
    }
  }
  if (
    !Array.isArray(side.guidePoints) ||
    side.guidePoints.length === 0 ||
    side.guidePoints.some((point) => point.trim().length === 0)
  ) {
    throw new TypeError(
      `comparisonV2: ${label}.guidePoints must contain at least one non-empty value`,
    );
  }
};

/**
 * 比較シェルデータを検証して凍結する。
 * defineArticleMetadata と同じ規約（定義時の TypeError 送出）に従う。
 */
export function defineComparisonV2(
  articleId: string,
  input: ComparisonV2EntryInput,
): ComparisonV2Entry {
  if (!/^[a-z0-9-]+$/.test(articleId)) {
    throw new TypeError(
      `comparisonV2: articleId "${articleId}" must be a kebab-case slug`,
    );
  }
  const metadata = articleMetadata.find(
    (article: { id: string }) => article.id === articleId,
  );
  if (!metadata) {
    throw new TypeError(
      `comparisonV2: unknown articleId "${articleId}" (not found in content/articles metadata)`,
    );
  }
  if (!input.left || !input.right) {
    throw new TypeError("comparisonV2: left and right must both be declared");
  }
  requireSideText(input.left, "left");
  requireSideText(input.right, "right");
  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    throw new TypeError(
      "comparisonV2: rows must contain at least one comparison row",
    );
  }
  for (const row of input.rows) {
    for (const field of ["label", "left", "right"] as const) {
      if (typeof row[field] !== "string" || row[field].trim().length === 0) {
        throw new TypeError(
          `comparisonV2: rows[].${field} must be a non-empty string (articleId: ${articleId})`,
        );
      }
    }
  }
  if (
    input.diagnosisHref !== undefined &&
    !input.diagnosisHref.startsWith("/")
  ) {
    throw new TypeError(
      "comparisonV2: diagnosisHref must be root-relative when declared",
    );
  }
  const leftPurchaseUrl = purchaseLinkIndex.get(
    `${articleId}:left`,
  )?.purchaseUrl;
  const rightPurchaseUrl = purchaseLinkIndex.get(
    `${articleId}:right`,
  )?.purchaseUrl;
  if (
    (!leftPurchaseUrl || !rightPurchaseUrl) &&
    metadata.purchaseLinkStatus === "verified"
  ) {
    throw new TypeError(
      `comparisonV2: articlePurchaseLinks must declare "${articleId}:left" and "${articleId}:right"`,
    );
  }
  return Object.freeze({
    articleId,
    ...input,
    left: Object.freeze({ ...input.left }),
    right: Object.freeze({ ...input.right }),
    rows: Object.freeze([...input.rows]),
    diagnosisHref: input.diagnosisHref,
    commonNote: input.commonNote,
    purchaseHrefs: Object.freeze({
      left: leftPurchaseUrl ?? "",
      right: rightPurchaseUrl ?? "",
    }),
    checkedAt: metadata.productInfoCheckedAt,
    purchaseLinkStatus: metadata.purchaseLinkStatus,
  });
}

/** レジストリ本体。キーは記事スラグ。 */
