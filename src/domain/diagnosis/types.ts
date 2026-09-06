/**
 * 商品選択診断の型定義。
 *
 * 商品データ・診断設定・診断結果の型をここに集約する。診断エンジンは
 * この型だけに依存し、UIやカテゴリ固有のロジックを持たない。
 */

/** 購入先リンク */
export type PurchaseLink = {
  provider: "rakuten" | "amazon" | "official" | "other";
  url: string;
  affiliate: boolean;
};

/** 判定根拠となる公式情報ソース */
export type ProductSource = {
  label: string;
  url: string;
  checkedAt: string;
};

/** 診断対象商品 */
export type Product = {
  id: string;
  categoryId: string;
  brand: string;
  name: string;
  /** 商品の特徴タグ（例: "glass", "ppsu", "portable"） */
  tags: string[];
  /** 診断ルールの判定に使う構造化属性 */
  attributes: Record<string, string | number | boolean>;
  /** 関連比較記事URL */
  articleUrls: string[];
  purchaseLinks: PurchaseLink[];
  sources: ProductSource[];
  /** 商品情報の確認日（ISO 8601 calendar date） */
  verifiedAt: string;
};

/** 商品条件（タグまたは属性で商品を特定する） */
export type ProductCondition =
  | {
      field: "tags";
      operator: "includes";
      value: string;
    }
  | {
      field: "attributes";
      key: string;
      operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
      value: string | number | boolean;
    };

/** スコア加算ルール（条件に一致した商品へ score を加算する） */
export type ScoreRule = {
  type: "score";
  /** 指定した場合、その商品だけに適用する */
  productId?: string;
  /** 指定した場合、条件に一致する商品だけに適用する */
  match?: ProductCondition;
  score: number;
  reasonCode?: string;
};

/** 除外ルール（条件に一致する商品を候補から外す） */
export type ExcludeRule = {
  type: "exclude";
  match: ProductCondition;
  reasonCode: string;
};

/** 診断ルールのunion */
export type DiagnosisRule = ScoreRule | ExcludeRule;

/** 質問の選択肢 */
export type DiagnosisOption = {
  id: string;
  label: string;
  rules: DiagnosisRule[];
};

/**
 * 質問の種別 (#561):
 * - "single"  : 単一選択（現状の全ての question で使用中）
 * - "boolean" : 質問 config で option.id を "true" / "false" として定義する単一選択
 * - "multi"   : 複数選択（現状未使用、型で先行宣言）
 * - "number"  : 数値回答（現状未使用、#561 で未実装として確認。
 *               将来 `selectedOptionIds` が number を文字列化する拡張を行うまで
 *               動作しない）
 */
export type QuestionType = "single" | "multi" | "boolean" | "number";

/** 診断質問 */
export type DiagnosisQuestion = {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  required: boolean;
  options?: DiagnosisOption[];
  /**
   * 質問の重要度スコア（既定: 1）。
   * 回答された質問の全 ScoreRule にこの値を乗算する。
   * 例: weight=2 の質問で +3 のルールが適用されると、実際の加点は +6 になる。
   * 除外ルール（exclude）には適用されない。
   * 範囲: 1〜10 の正の整数。validate.ts がビルド時に検証する。
   */
  weight?: number;
};

/** 同点時のタイブレーク規則 */
export type TieBreakerRule =
  | {
      type: "attribute";
      key: string;
      direction: "asc" | "desc";
    }
  | {
      type: "editorialPriority";
      productIds: string[];
    };

/** 結果表示設定 */
export type ResultConfig = {
  /** 1位表示用の見出しテンプレート（{productName} を置換する） */
  topHeadingTemplate: string;
  /** 信頼性の注記 */
  disclaimer: string;
};

/** 診断設定（カテゴリごとに1つ定義する） */
export type DiagnosisConfig = {
  id: string;
  categoryId: string;
  /** カテゴリの表示名（例: "授乳用品"） */
  categoryLabel: string;
  title: string;
  description: string;
  productIds: string[];
  questions: DiagnosisQuestion[];
  tieBreaker?: TieBreakerRule[];
  resultConfig: ResultConfig;
};

/** ユーザー回答 */
export type DiagnosisAnswers = Record<
  string,
  string | string[] | number | boolean
>;

/** 商品ごとのスコアリング結果 */
export type ProductScore = {
  productId: string;
  score: number;
  excluded: boolean;
  excludeReasonCode?: string;
  /** 加点理由（reasonCode） */
  positiveReasons: string[];
  /** 減点・注意理由（reasonCode） */
  negativeReasons: string[];
};

/** 順位付き商品 */
export type RankedProduct = {
  productId: string;
  rank: number;
  score: number;
  positiveReasons: string[];
  cautions: string[];
};

/** 除外された商品 */
export type ExcludedProduct = {
  productId: string;
  reasonCode: string;
};

/** 診断結果 */
export type DiagnosisResult = {
  categoryId: string;
  rankedProducts: RankedProduct[];
  excludedProducts: ExcludedProduct[];
  answeredQuestionCount: number;
};

/** 診断状態（localStorage保存用） */
export type DiagnosisState = {
  answers: DiagnosisAnswers;
  currentQuestionIndex: number;
  completed: boolean;
};

/** 理由コードから表示文言へ変換する辞書 */
export type ReasonDictionary = Record<string, string>;

/**
 * 診断ページの静的コンテンツ（SEO用）。
 * 質問UI部分はJSで動かすが、ページの説明・診断対象・選び方・FAQは
 * このデータからSSGで出力する。
 */
export type DiagnosisPageContent = {
  /** ページタイトル（<title>） */
  pageTitle: string;
  /** H1見出し */
  headline: string;
  /** ページメタディスクリプション */
  pageDescription: string;
  /** ページ冒頭のリード文 */
  lead: string;
  /** 誰向けの診断か（1文） */
  audience: string;
  /** 診断対象の商品説明（箇条書き） */
  targetItems: string[];
  /** 選び方のポイント（h3見出し + 本文） */
  guideSections: {
    heading: string;
    body: string;
  }[];
  /** 診断ページ用FAQ */
  faq: {
    question: string;
    answer: string;
  }[];
  /** 関連する比較記事（path + ラベル） */
  relatedArticles: {
    path: string;
    label: string;
  }[];
};

/** 診断カテゴリの登録情報（レジストリが保持する） */
export type DiagnosisCategory = {
  /** URL スラグ（例: "baby-bottle"） */
  slug: string;
  config: DiagnosisConfig;
  products: readonly Product[];
  reasons: ReasonDictionary;
  pageContent: DiagnosisPageContent;
};
