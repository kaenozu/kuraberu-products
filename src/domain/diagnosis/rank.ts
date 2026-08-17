/**
 * ランキングとタイブレーク。
 *
 * スコア降順で並べ、同点時のみ TieBreaker を適用する。TieBreaker は
 * 属性比較 → editorialPriority の順に試し、決定論的に順位を決める。
 * editorialPriority は最後のタイブレーク専用で、恣意的な順位操作には
 * 使わない。
 */

import type { Product, ProductScore, TieBreakerRule } from "./types";

function compareNumbers(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** 属性キーの値で比較する（数値比較を優先し、文字列は辞書順） */
function compareByAttribute(
  left: Product,
  right: Product,
  key: string,
): number {
  const leftValue = left.attributes[key];
  const rightValue = right.attributes[key];
  const leftNumber = typeof leftValue === "number" ? leftValue : undefined;
  const rightNumber = typeof rightValue === "number" ? rightValue : undefined;
  if (leftNumber !== undefined && rightNumber !== undefined) {
    return compareNumbers(leftNumber, rightNumber);
  }
  const leftString = String(leftValue ?? "");
  const rightString = String(rightValue ?? "");
  return leftString.localeCompare(rightString, "ja");
}

function compareByEditorialPriority(
  left: Product,
  right: Product,
  productIds: readonly string[],
): number {
  const leftIndex = productIds.indexOf(left.id);
  const rightIndex = productIds.indexOf(right.id);
  if (leftIndex === -1 && rightIndex === -1) return 0;
  if (leftIndex === -1) return 1;
  if (rightIndex === -1) return -1;
  return compareNumbers(leftIndex, rightIndex);
}

/**
 * 同点の商品ペアをタイブレーク規則で比較する。
 * 最初に差が出た規則の結果を返す。全規則で同点なら 0。
 */
export function tieBreakCompare(
  left: Product,
  right: Product,
  rules: readonly TieBreakerRule[],
): number {
  for (const rule of rules) {
    let result = 0;
    if (rule.type === "attribute") {
      result = compareByAttribute(left, right, rule.key);
      if (rule.direction === "desc") result = -result;
    } else if (rule.type === "editorialPriority") {
      result = compareByEditorialPriority(left, right, rule.productIds);
    }
    if (result !== 0) return result;
  }
  return 0;
}

export type RankedScore = ProductScore & { rank: number };

/**
 * 候補をスコア降順に並べ、同点時のみタイブレークを適用して順位を付ける。
 * タイブレークなしの場合は元の商品順（入力順）を維持する。
 */
export function rankProducts(
  products: readonly Product[],
  scores: Map<string, ProductScore>,
  tieBreaker: readonly TieBreakerRule[] = [],
): RankedScore[] {
  const eligible = products
    .map((product) => scores.get(product.id))
    .filter(
      (score): score is ProductScore => score !== undefined && !score.excluded,
    );

  const sorted = [...eligible].sort((left, right) => {
    const byScore = compareNumbers(right.score, left.score);
    if (byScore !== 0) return byScore;
    if (tieBreaker.length === 0) return 0;
    const leftProduct = products.find(
      (product) => product.id === left.productId,
    );
    const rightProduct = products.find(
      (product) => product.id === right.productId,
    );
    if (!leftProduct || !rightProduct) return 0;
    return tieBreakCompare(leftProduct, rightProduct, tieBreaker);
  });

  return sorted.map((score, index) => ({ ...score, rank: index + 1 }));
}
