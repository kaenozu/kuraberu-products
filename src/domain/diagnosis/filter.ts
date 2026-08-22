/**
 * 商品条件（ProductCondition）のマッチングと候補フィルタ。
 *
 * 必須条件はスコアではなく exclude で表現する。exclude はスコア計算より
 * 先に適用され、条件に一致した商品は候補から完全に外れる。
 */

import type { Product, ProductCondition, ProductScore } from "./types";

/** 属性値を比較可能な数値へ変換する（できない場合は undefined） */
export function toNumber(value: string | number | boolean): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function compareValues(
  left: unknown,
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte",
  right: string | number | boolean,
): boolean {
  if (operator === "eq") {
    return left === right || String(left) === String(right);
  }
  if (operator === "neq") {
    // 属性が欠落した商品（left === undefined）は比較不能 = 不一致扱いにする（fail-closed）。
    // ※validate.ts がルールキーの実在を担保するため、これは防御強化。
    return (
      left !== undefined && left !== right && String(left) !== String(right)
    );
  }
  const leftNumber = toNumber(left as string | number | boolean);
  const rightNumber = toNumber(right);
  if (leftNumber === undefined || rightNumber === undefined) return false;
  if (operator === "gt") return leftNumber > rightNumber;
  if (operator === "gte") return leftNumber >= rightNumber;
  if (operator === "lt") return leftNumber < rightNumber;
  return leftNumber <= rightNumber;
}

/** 商品が条件を満たすかを判定する */
export function matchesCondition(
  product: Product,
  condition: ProductCondition,
): boolean {
  if (condition.field === "tags") {
    if (condition.operator !== "includes") return false;
    return product.tags.includes(condition.value);
  }
  const value = product.attributes[condition.key];
  return compareValues(value, condition.operator, condition.value);
}

/** 候補商品の初期スコア（全商品0から開始）を作る */
export function initializeScores(
  products: readonly Product[],
): Map<string, ProductScore> {
  const scores = new Map<string, ProductScore>();
  for (const product of products) {
    scores.set(product.id, {
      productId: product.id,
      score: 0,
      excluded: false,
      positiveReasons: [],
      negativeReasons: [],
    });
  }
  return scores;
}

/** exclude ルールを適用し、条件に一致する商品を候補から外す */
export function applyExclusions(
  scores: Map<string, ProductScore>,
  products: readonly Product[],
  rules: readonly { match: ProductCondition; reasonCode: string }[],
): void {
  for (const rule of rules) {
    for (const product of products) {
      if (!matchesCondition(product, rule.match)) continue;
      const score = scores.get(product.id);
      if (!score) continue;
      score.excluded = true;
      score.excludeReasonCode = rule.reasonCode;
    }
  }
}
