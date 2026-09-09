export const comparisonMemoStorageKey = "kuraberu:comparison-memo:v1";
export const comparisonMemoLimit = 50;

export interface ComparisonMemoState {
  version: 1;
  ids: readonly string[];
}

export function sanitizeComparisonMemo(
  raw: string | null,
  /**
   * @param knownIds 記事IDの許可リスト。省略時はIDの存在確認を行わず、
   * 診断画面のように部分集合しか持たない呼び出し元でも既存IDを保持する。
   */
  knownIds?: readonly string[],
): ComparisonMemoState {
  if (!raw) return { version: 1, ids: [] };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { version: 1, ids: [] };
    const candidate = parsed as { version?: unknown; ids?: unknown };
    if (candidate.version !== 1 || !Array.isArray(candidate.ids)) {
      return { version: 1, ids: [] };
    }
    const allowed = knownIds === undefined ? null : new Set(knownIds);
    const ids: string[] = [];
    for (const value of candidate.ids) {
      if (
        typeof value !== "string" ||
        (allowed !== null && !allowed.has(value)) ||
        ids.includes(value)
      )
        continue;
      ids.push(value);
      if (ids.length >= comparisonMemoLimit) break;
    }
    return { version: 1, ids };
  } catch {
    return { version: 1, ids: [] };
  }
}

export function encodeComparisonMemo(ids: readonly string[]): string {
  return JSON.stringify({
    version: 1,
    ids: [...ids].slice(0, comparisonMemoLimit),
  });
}

export function toggleComparisonMemo(
  state: ComparisonMemoState,
  articleId: string,
): { state: ComparisonMemoState; added: boolean; atLimit: boolean } {
  if (state.ids.includes(articleId)) {
    return {
      state: { version: 1, ids: state.ids.filter((id) => id !== articleId) },
      added: false,
      atLimit: false,
    };
  }
  if (state.ids.length >= comparisonMemoLimit) {
    return { state, added: false, atLimit: true };
  }
  return {
    state: { version: 1, ids: [...state.ids, articleId] },
    added: true,
    atLimit: false,
  };
}
