/**
 * 診断結果を比較メモに保存するモジュール。
 *
 * 診断でおすすめされた商品の関連記事を比較メモに追加する。
 * 比較メモは記事IDで管理されるため、商品の articleUrls から記事IDを抽出して保存する。
 */

import {
  comparisonMemoStorageKey,
  comparisonMemoLimit,
  sanitizeComparisonMemo,
  encodeComparisonMemo,
  toggleComparisonMemo,
  type ComparisonMemoState,
} from "./comparison-memo";

/** パスから記事IDを抽出する（例: "/articles/pigeon-bottle-160-240/" → "pigeon-bottle-160-240"） */
export function extractArticleIdFromPath(path: string): string | null {
  const match = path.match(/^\/articles\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

/** 商品の articleUrls から記事IDの配列を取得する */
export function extractArticleIdsFromProduct(product: {
  articleUrls: readonly string[];
}): string[] {
  return product.articleUrls
    .map(extractArticleIdFromPath)
    .filter((id): id is string => id !== null);
}

/** 比較メモの状態をlocalStorageから読み取る */
export function loadComparisonMemo(knownIds: readonly string[]): ComparisonMemoState {
  try {
    const raw = localStorage.getItem(comparisonMemoStorageKey);
    return sanitizeComparisonMemo(raw, knownIds);
  } catch {
    return { version: 1, ids: [] };
  }
}

/** 比較メモの状態をlocalStorageに保存する */
export function saveComparisonMemo(state: ComparisonMemoState): void {
  try {
    const encoded = encodeComparisonMemo(state.ids);
    localStorage.setItem(comparisonMemoStorageKey, encoded);
  } catch {
    // プライベートモード等で保存できない場合は黙って無視する
  }
}

/** 商品の関連記事を比較メモに追加する */
export function addProductArticlesToMemo(
  product: { articleUrls: readonly string[] },
  knownIds: readonly string[],
): { added: string[]; alreadyExists: string[]; atLimit: boolean } {
  const articleIds = extractArticleIdsFromProduct(product);
  const memoState = loadComparisonMemo(knownIds);

  const added: string[] = [];
  const alreadyExists: string[] = [];
  let currentState = memoState;
  let atLimit = false;

  for (const articleId of articleIds) {
    if (currentState.ids.includes(articleId)) {
      alreadyExists.push(articleId);
      continue;
    }

    const result = toggleComparisonMemo(currentState, articleId);
    if (result.atLimit) {
      atLimit = true;
      break;
    }

    if (result.added) {
      added.push(articleId);
      currentState = result.state;
    }
  }

  if (added.length > 0) {
    saveComparisonMemo(currentState);
  }

  return { added, alreadyExists, atLimit };
}

/** 商品が比較メモに含まれているかどうかを判定する */
export function isProductInMemo(
  product: { articleUrls: readonly string[] },
  knownIds: readonly string[],
): boolean {
  const articleIds = extractArticleIdsFromProduct(product);
  const memoState = loadComparisonMemo(knownIds);
  return articleIds.some((id) => memoState.ids.includes(id));
}

/** 比較メモから商品の関連記事を削除する */
export function removeProductArticlesFromMemo(
  product: { articleUrls: readonly string[] },
  knownIds: readonly string[],
): { removed: string[] } {
  const articleIds = extractArticleIdsFromProduct(product);
  const memoState = loadComparisonMemo(knownIds);

  const removed: string[] = [];
  let currentState = memoState;

  for (const articleId of articleIds) {
    if (!currentState.ids.includes(articleId)) continue;
    const result = toggleComparisonMemo(currentState, articleId);
    if (!result.added) {
      removed.push(articleId);
      currentState = result.state;
    }
  }

  if (removed.length > 0) {
    saveComparisonMemo(currentState);
  }

  return { removed };
}
