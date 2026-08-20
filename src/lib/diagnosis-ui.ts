/**
 * 診断UI 純粋ロジック（DOM操作なし）。
 *
 * [category].astro の <script> ブロックから抽出したテスト可能な関数群。
 * DOM構築は呼び出し側（Astro script）が行い、このモジュールはデータ構造のみを返す。
 */

import { reasonMessages } from "../domain/diagnosis/reasons";
import type {
  DiagnosisResult,
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
  const purchaseLinks = product.purchaseLinks.map((link) =>
    buildPurchaseLinkData(link, product, index),
  );

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
 */
export function buildPurchaseLinkData(
  link: PurchaseLink,
  product: Product,
  index: number,
): PurchaseLinkData {
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
