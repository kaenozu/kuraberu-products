/**
 * 診断UI 純粋ロジック（DOM操作なし）。
 *
 * [category].astro の <script> ブロックから抽出したテスト可能な関数群。
 * DOM構築は呼び出し側（Astro script）が行い、このモジュールはデータ構造のみを返す。
 */

import { isVerifiedRakutenPurchaseDestination } from "../../config/runtime-env.mjs";
import { reasonMessages } from "../domain/diagnosis/reasons";
import type {
  DiagnosisResult,
  DiagnosisQuestion,
  DiagnosisAnswers,
  Product,
  PurchaseLink,
  RankedProduct,
  ReasonDictionary,
} from "../domain/diagnosis/types";

/**
 * 「次へ」ボタンを disabled にするかどうか。
 *
 * UIの `nextBtn.disabled = question.required && !hasAnswer(question.id)` に対応。
 * required な質問に未回答なら disabled、optional なら常に enabled。
 */
export function buttonDisabled(required: boolean, hasAnswer: boolean): boolean {
  return required && !hasAnswer;
}

/**
 * 回答が存在するかどうか。
 *
 * undefined / null / 空文字列 / 空配列 は「未回答」とみなす。
 */
export function hasAnswer(
  answer: string | string[] | number | boolean | undefined,
): boolean {
  if (Array.isArray(answer)) return answer.length > 0;
  return (
    answer !== undefined && answer !== null && String(answer).trim().length > 0
  );
}

export function sanitizeDiagnosisAnswers(
  questions: readonly DiagnosisQuestion[],
  raw: unknown,
): { answers: DiagnosisAnswers; firstInvalidRequiredIndex: number | null } {
  const answers: DiagnosisAnswers = {};
  const candidate =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  questions.forEach((question) => {
    const value = candidate[question.id];
    const optionIds = new Set(
      (question.options ?? []).map((option) => option.id),
    );
    const valid =
      question.type === "multi"
        ? Array.isArray(value) &&
          value.length > 0 &&
          value.every((item) => typeof item === "string" && optionIds.has(item))
        : question.type === "number"
          ? typeof value === "number" && Number.isFinite(value)
          : typeof value === "string" && optionIds.has(value);
    if (valid) answers[question.id] = value as DiagnosisAnswers[string];
  });

  const firstInvalidRequiredIndex =
    questions.findIndex(
      (question) => question.required && !hasAnswer(answers[question.id]),
    ) ?? -1;
  return {
    answers,
    firstInvalidRequiredIndex:
      firstInvalidRequiredIndex >= 0 ? firstInvalidRequiredIndex : null,
  };
}

/**
 * 進捗テキストを生成する（例: "1 / 5 問目"）。
 */
export function buildProgressText(
  currentIndex: number,
  totalQuestions: number,
): string {
  return `${currentIndex + 1} / ${totalQuestions} 問目`;
}

/**
 * 「次へ」ボタンのテキストを返す。
 * 最後の質問なら「結果を見る」、それ以外は「次へ」。
 */
export function buildNextButtonText(
  currentIndex: number,
  totalQuestions: number,
): string {
  return currentIndex === totalQuestions - 1 ? "結果を見る" : "次へ";
}

/**
 * 表示対象の商品を決定する（1位 + 2位以下最大3件 = 最大4件）。
 */
export function computeVisibleProducts(
  result: DiagnosisResult,
  maxCount = 4,
): RankedProduct[] {
  return result.rankedProducts.slice(0, maxCount);
}

/**
 * 結果カードの表示データを構築する。
 *
 * 返回値はDOM構築に必要なすべてのデータを含む純粋なオブジェクト。
 */
export type ResultCardData = {
  product: Product;
  rankLabel: string;
  cardClass: string;
  reasons: string[];
  cautions: string[];
  /** 最上位商品の「気になる点」表示用テキスト */
  topCautionHtml: string;
  /** 2位以下の「こちらが向くケース」表示用テキスト */
  caseText: string;
  articleLinks: ArticleLinkData[];
  purchaseLinks: PurchaseLinkData[];
};

/**
 * 記事リンクの表示データ。
 */
export type ArticleLinkData = {
  href: string;
  label: string;
  dataset: Record<string, string>;
};

/**
 * 購入リンクの表示データ。
 */
export type PurchaseLinkData = {
  href: string;
  target: string;
  rel: string;
  label: string;
  dataset: Record<string, string>;
};

/**
 * #436: 楽天の購入 CTA は到達先を検証できる商品詳細ページのみ。
 * 検証できないリンクは buildPurchaseLinkData が undefined を返し表示しない。
 */

/**
 * プロバイダー別の購入リンク表示ラベル。
 */
export const PROVIDER_LABELS: Record<string, string> = {
  rakuten: "楽天で商品を見る",
  amazon: "Amazonで商品を見る",
  official: "公式サイトで確認する",
};

export function buildResultCardData(
  product: Product,
  entry: RankedProduct,
  index: number,
  reasonDictionary: ReasonDictionary,
): ResultCardData {
  const rankLabel = index === 0 ? "おすすめ" : `${index + 1}位`;
  const cardClass =
    index === 0 ? "diagnosis-card diagnosis-card--top" : "diagnosis-card";
  const reasons = reasonMessages(entry.positiveReasons, reasonDictionary).slice(
    0,
    3,
  );
  const cautions = reasonMessages(entry.cautions, reasonDictionary).slice(0, 3);

  let topCautionHtml = "";
  if (index === 0 && cautions.length > 0) {
    topCautionHtml = `<p class="diagnosis-card__note-label">気になる点</p><ul class="diagnosis-card__cautions">${cautions.map((m) => `<li>・${m}</li>`).join("")}</ul>`;
  }

  let caseText = "";
  if (index > 0) {
    caseText =
      cautions.length > 0
        ? cautions.join("。")
        : "条件によってはこちらも候補になります。";
  }

  const articleLinks = product.articleUrls.map((url) =>
    buildArticleLinkData(url, product, index),
  );
  const purchaseLinks = product.purchaseLinks
    .map((link) => buildPurchaseLinkData(link, product, index))
    .filter((link): link is PurchaseLinkData => link !== undefined);

  return {
    product,
    rankLabel,
    cardClass,
    reasons,
    cautions,
    topCautionHtml,
    caseText,
    articleLinks,
    purchaseLinks,
  };
}

/**
 * 記事リンクのデータを構築する。
 */
export function buildArticleLinkData(
  url: string,
  product: Product,
  index: number,
): ArticleLinkData {
  return {
    href: url,
    label: "詳しい比較を見る",
    dataset: {
      diagnosisArticleLink: "",
      productId: product.id,
      rank: String(index + 1),
    },
  };
}

/**
 * 購入リンクのデータを構築する。
 * #436: 楽天リンクは最終到達先が確認できる商品詳細ページ（直リンクまたは
 * pc パラメータが商品詳細ページのアフィリエイトURL）のみ CTA にする。
 * 検索結果ページへのリダイレクトや不透明ショートリンクは
 * 「商品ページを見る」表示で誤導になるため undefined（表示しない）を返す。
 */
export function buildPurchaseLinkData(
  link: PurchaseLink,
  product: Product,
  index: number,
): PurchaseLinkData | undefined {
  if (
    link.provider === "rakuten" &&
    !isVerifiedRakutenPurchaseDestination(link.url)
  ) {
    return undefined;
  }
  return {
    href: link.url,
    target: "_blank",
    rel: link.affiliate
      ? "sponsored nofollow noopener noreferrer"
      : "noopener noreferrer",
    label: PROVIDER_LABELS[link.provider] ?? "販売ページを見る",
    dataset: {
      ctaEvent: "purchase",
      productId: product.id,
      placement: "diagnosis-result",
      rank: String(index + 1),
    },
  };
}
