/**
 * ランキングとタイブレーク。
 *
 * スコア降順で並べ、同点時のみタイブレークを適用する。タイブレークは
 * 仕様（21節）に従い、属性比較（公式仕様上の差）→ editorialPriority の順に
 * 試す。editorialPriority は常に最後のタイブレークとして扱い、恣意的な
 * 順位操作には使わない。
 *
 * ソート比較器内で products.find を呼ぶと O(n²) になるため、
 * productId → Product の Map を1度構築して参照する (#555)。
 * ソートの安定性は V8 (Node.js) の TimSort を前提とする。
 */

import type { Product, ProductScore, TieBreakerRule } from "./types";
import { toNumber } from "./filter";

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
  const leftNumber = toNumber(leftValue as string | number | boolean);
  const rightNumber = toNumber(rightValue as string | number | boolean);
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
 * editorialPriority は常に最後に適用する（config の記載順に依存しない）。
 * 全規則で同点なら 0。
 */
export function tieBreakCompare(
  left: Product,
  right: Product,
  rules: readonly TieBreakerRule[],
): number {
  const ordered = [
    ...rules.filter((rule) => rule.type === "attribute"),
    ...rules.filter((rule) => rule.type === "editorialPriority"),
  ];
  for (const rule of ordered) {
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

  // ソート比較器内で productId → Product の参照を O(1) で行うための Map。
  // products.find を比較ごとに呼ぶと O(n²) になる。
  const productById = new Map<string, Product>(
    products.map((product) => [product.id, product]),
  );

  const sorted = [...eligible].sort((left, right) => {
    const byScore = compareNumbers(right.score, left.score);
    if (byScore !== 0) return byScore;
    if (tieBreaker.length === 0) return 0;
    const leftProduct = productById.get(left.productId);
    const rightProduct = productById.get(right.productId);
    if (!leftProduct || !rightProduct) return 0;
    return tieBreakCompare(leftProduct, rightProduct, tieBreaker);
  });

  return sorted.map((score, index) => ({ ...score, rank: index + 1 }));
}
