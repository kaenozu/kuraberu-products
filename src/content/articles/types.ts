export interface ArticleChangeLogEntry {
  date: string;
  summary: string;
}

/**
 * 比較記事の片側商品情報。
 * purchaseHref は articlePurchaseLinks から自動解決するため不要。
 */
export interface ComparisonSide {
  brand: string;
  line: string;
  tagline: string;
  image: string;
  imageAlt: string;
  officialHref: string;
  guidePoints: readonly string[];
}

/** 比較行（ verifiedRows / keyDiffRows 共通） */
export type ComparisonRow = {
  label: string;
  left: string;
  right: string;
  highlight?: "left" | "right" | null;
  highlightNote?: string;
  bar?: { left: number; right: number };
  direction?: "higher-is-better" | "lower-is-better";
};

/**
 * 全記事タイプに共通するフィールド。
 *
 * 比較記事固有のフィールドもこの型に含める（Component 側で productCount による
 * narrow 不要のため）。guide 固有の {@link GuideArticleMetadata.aboutProductNames}
 * はこの型ではオプション。
 */
export type ArticleMetadataBase = {
  id: string;
  productCount: number;
  path: `/articles/${string}/`;
  title: string;
  headline: string;
  description: string;
  category: string;
  tags: readonly string[];
  audiences: readonly string[];
  uses: readonly string[];
  summary: string;
  publishedAt: string;
  modifiedAt: string;
  productInfoCheckedAt?: string;
  purchaseLinksCheckedAt?: string;
  purchaseLinkStatus: "verified" | "unverified" | "unavailable";
  changeLog: readonly ArticleChangeLogEntry[];
  imagePath?: `/${string}`;
  /**
   * JSON-LD の about（schema.org Product）に出す商品名。
   * 商品ガイド（productCount = 1）は必須。比較記事は未宣言なら about を出力しない。
   */
  aboutProductNames?: readonly string[];
  officialSources?: readonly {
    label: string;
    url: `https://${string}`;
  }[];
  verifiedRows?: readonly ComparisonRow[];
  /** 比較記事: 左側商品のモデル情報。 */
  leftModel?: ComparisonSide;
  /** 比較記事: 右側商品のモデル情報。 */
  rightModel?: ComparisonSide;
  /** 比較記事: ハイライト比較行。 */
  keyDiffRows?: readonly ComparisonRow[];
  /** 比較記事: FAQ エントリ。 */
  faqEntries?: readonly { question: string; answer: string }[];
  /** 比較記事: リード文。 */
  lead?: string;
  /** 比較記事: まとめ段落。 */
  summaryParagraph?: string;
  /** 比較記事: 公式情報セクションの説明文。 */
  officialDescription?: string;
  /** 比較記事: 公式リンク。 */
  officialLinks?: readonly { label: string; href: string }[];
  /** 比較記事: SNS ソーシャルプルーフ検索クエリ。 */
  socialProofQuery?: string;
  /** 比較記事: ソーシャルプルーフ確認日。 */
  socialProofCheckedAt?: string;
  /** 比較記事: 購入時の注意テキスト。 */
  purchaseWarning?: string;
  /** 比較記事: 免責事項テキスト。 */
  disclaimer?: string;
};

/**
 * 商品ガイド記事（productCount = 1）。
 * aboutProductNames は必須（JSON-LD の about に出力するため）。
 */
export type GuideArticleMetadata = ArticleMetadataBase & {
  productCount: 1;
  aboutProductNames: readonly string[];
};

/**
 * 比較記事（productCount = 2）。
 * leftModel/rightModel はオプション（宣言すると1行記事になる）。
 */
export type ComparisonArticleMetadata = ArticleMetadataBase & {
  productCount: 2;
};

/**
 * 記事メタデータの区分型共用体。
 *
 * productCount で分岐し、ガイド記事と比較記事で型安全性を確保する。
 * Component 側では比較フィールドに直接アクセスできる（ArticleMetadataBase に含まれるため）。
 */
export type ArticleMetadata = GuideArticleMetadata | ComparisonArticleMetadata;

/**
 * 比較シェル（ArticleComparisonV2Section）に渡す片側商品。
 * purchaseHref / checkedAt / purchaseLinkStatus はセクション側で
 * articlePurchaseLinks・記事メタデータから自動解決するため宣言しない。
 */
export interface ComparisonV2Side {
  brand: string;
  line: string;
  tagline: string;
  image: string;
  imageAlt: string;
  /** メーカー公式ページURL（広告リンクは不可） */
  officialHref: string;
  guidePoints: readonly string[];
  /** クリック計測用の商品ID（任意） */
  productId?: string;
}

/**
 * 手書き比較記事の比較シェル宣言（articleId で引くレジストリの要素）。
 *
 * ページ直書きだった ArticleComparisonV2 の props を移設するための契約。
 * faqEntries は本文側の FAQ リストも参照するためここへ一元する。
 * 本文が公式仕様（仕様ページURL・寸法など）を参照する記事は、
 * 片側オブジェクトに追加フィールドを持たせてよい（{@link defineComparisonV2Article} が
 * 構造的部分型で受け入れる）。
 */
export interface ComparisonV2Article {
  left: ComparisonV2Side;
  right: ComparisonV2Side;
  rows: readonly ComparisonRow[];
  /** VisualKeyDifferences の「この一覧以外は両商品とも同じ」注記 */
  commonNote?: string;
  /** 「次にすること」ブロックの診断カテゴリURL */
  diagnosisHref?: string;
  /** 本文の FAQ（question/answer はそのまま出力される） */
  faqEntries: readonly { question: string; answer: string }[];
}

const comparisonV2RequiredSideFields = [
  "brand",
  "line",
  "tagline",
  "image",
  "imageAlt",
  "officialHref",
] as const;

/**
 * {@link defineArticleMetadata} と同じ検証付きヘルパーパターンで
 * 比較シェル宣言を定義する。ジェネリクスで受け取るため、片側オブジェクトへの
 * 本文用追加フィールド（specUrl など）は型情報ごと保持される。
 */
export function defineComparisonV2Article<T extends ComparisonV2Article>(
  article: T,
): T {
  for (const [label, side] of [
    ["left", article.left],
    ["right", article.right],
  ] as const) {
    for (const field of comparisonV2RequiredSideFields) {
      if (!side[field].trim()) {
        throw new TypeError(`${label}.${field} must be a non-empty string`);
      }
    }
    if (!side.officialHref.startsWith("https://")) {
      throw new TypeError(
        `${label}.officialHref must be an absolute https:// manufacturer URL`,
      );
    }
    if (
      side.guidePoints.length === 0 ||
      side.guidePoints.some((point) => !point.trim())
    ) {
      throw new TypeError(
        `${label}.guidePoints must contain at least one non-empty entry`,
      );
    }
  }
  if (article.rows.length === 0) {
    throw new TypeError("rows must contain at least one comparison row");
  }
  if (article.faqEntries.length === 0) {
    throw new TypeError("faqEntries must contain at least one entry");
  }
  for (const entry of article.faqEntries) {
    if (!entry.question.trim() || !entry.answer.trim()) {
      throw new TypeError("faqEntries must not contain empty question/answer");
    }
  }
  return Object.freeze({ ...article }) as T;
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

// Build-time reference date in Asia/Tokyo to prevent future dates.
// UTC-based toISOString() causes false rejects between JST 00:00–08:59
// when the JST calendar date is "today" but UTC is still yesterday.
let buildReferenceDate = (() => {
  const now = new Date();
  const jstDateStr = now.toLocaleDateString("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return jstDateStr; // YYYY-MM-DD in Asia/Tokyo
})();

/**
 * Override the build reference date for testing.
 * Pass null to reset to the real JST date.
 */
export function _setBuildReferenceDate(date: string | null): void {
  if (date === null) {
    const now = new Date();
    buildReferenceDate = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } else {
    buildReferenceDate = date;
  }
}

export function defineArticleMetadata(
  metadata: ArticleMetadata,
): ArticleMetadata {
  if (!Number.isInteger(metadata.productCount) || metadata.productCount < 1) {
    throw new TypeError("productCount must be a positive integer");
  }
  if (metadata.productCount === 1 && !metadata.aboutProductNames) {
    throw new TypeError(
      "aboutProductNames must be declared for single-product (guide) articles",
    );
  }
  if (
    metadata.aboutProductNames !== undefined &&
    (metadata.aboutProductNames.length !== metadata.productCount ||
      metadata.aboutProductNames.some((name) => name.trim().length === 0))
  ) {
    throw new TypeError(
      `aboutProductNames must have exactly ${metadata.productCount} non-empty entries (one per product)`,
    );
  }
  // 比較記事の1行化: leftModel/rightModel は keyDiffRows/faqEntries とセットで宣言する必要がある
  if (metadata.leftModel || metadata.rightModel) {
    if (!metadata.leftModel || !metadata.rightModel) {
      throw new TypeError(
        "leftModel and rightModel must both be declared together",
      );
    }
    if (!metadata.keyDiffRows || metadata.keyDiffRows.length === 0) {
      throw new TypeError(
        "keyDiffRows is required when leftModel/rightModel are declared",
      );
    }
    if (!metadata.faqEntries || metadata.faqEntries.length === 0) {
      throw new TypeError(
        "faqEntries is required when leftModel/rightModel are declared",
      );
    }
    if (!metadata.lead) {
      throw new TypeError(
        "lead is required when leftModel/rightModel are declared",
      );
    }
  }

  for (const [label, value] of [
    ["publishedAt", metadata.publishedAt],
    ["modifiedAt", metadata.modifiedAt],
    ...(metadata.productInfoCheckedAt
      ? [["productInfoCheckedAt", metadata.productInfoCheckedAt] as const]
      : []),
    ...(metadata.purchaseLinksCheckedAt
      ? [["purchaseLinksCheckedAt", metadata.purchaseLinksCheckedAt] as const]
      : []),
    ...metadata.changeLog.map(
      (entry) => ["changeLog.date", entry.date] as const,
    ),
  ] as const) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (
      !isoDate.test(value) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    ) {
      throw new TypeError(`${label} must be an ISO 8601 calendar date`);
    }
  }
  if (metadata.modifiedAt < metadata.publishedAt) {
    throw new TypeError("modifiedAt must not precede publishedAt");
  }
  if (
    metadata.productInfoCheckedAt &&
    metadata.productInfoCheckedAt > metadata.modifiedAt
  ) {
    throw new TypeError("productInfoCheckedAt must not exceed modifiedAt");
  }
  if (
    metadata.purchaseLinksCheckedAt &&
    metadata.purchaseLinksCheckedAt > metadata.modifiedAt
  ) {
    throw new TypeError("purchaseLinksCheckedAt must not exceed modifiedAt");
  }
  if (
    metadata.purchaseLinkStatus === "verified" &&
    !metadata.purchaseLinksCheckedAt
  ) {
    throw new TypeError("verified purchase links require a checked date");
  }
  // Prevent future dates relative to build time
  for (const [label, value] of [
    ["publishedAt", metadata.publishedAt],
    ["modifiedAt", metadata.modifiedAt],
    ...(metadata.productInfoCheckedAt
      ? [["productInfoCheckedAt", metadata.productInfoCheckedAt] as const]
      : []),
    ...(metadata.purchaseLinksCheckedAt
      ? [["purchaseLinksCheckedAt", metadata.purchaseLinksCheckedAt] as const]
      : []),
    ...metadata.changeLog.map(
      (entry) => ["changeLog.date", entry.date] as const,
    ),
  ] as const) {
    if (value > buildReferenceDate) {
      throw new TypeError(
        `${label} (${value}) must not be a future date relative to build (${buildReferenceDate})`,
      );
    }
  }
  for (const [label, values] of [
    ["tags", metadata.tags],
    ["audiences", metadata.audiences],
    ["uses", metadata.uses],
  ] as const) {
    if (values.length === 0) {
      throw new TypeError(`${label} must contain at least one value`);
    }
    const normalized = values.map((value) => value.normalize("NFKC").trim());
    if (normalized.some((value) => value.length === 0)) {
      throw new TypeError(`${label} must not contain empty values`);
    }
    if (new Set(normalized).size !== normalized.length) {
      throw new TypeError(`${label} must not contain duplicate values`);
    }
  }
  if (metadata.changeLog.length === 0) {
    throw new TypeError("changeLog must contain at least one factual entry");
  }
  for (const entry of metadata.changeLog) {
    if (!entry.summary.trim()) {
      throw new TypeError("changeLog summary must not be empty");
    }
  }
  if (!metadata.path.endsWith("/") || !metadata.path.startsWith("/articles/")) {
    throw new TypeError("article path must be a canonical /articles/.../ path");
  }
  if (metadata.imagePath && !metadata.imagePath.startsWith("/")) {
    throw new TypeError("imagePath must be root-relative");
  }
  return Object.freeze({ ...metadata }) as ArticleMetadata;
}
