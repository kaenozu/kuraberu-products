/**
 * 楽天API パフォーマンス計測モジュール。
 *
 * Cloudflare Workers のリクエストスコープ内で使われる。
 * 設計方針:
 * - リクエストごとに RakutenPerfCollector を生成し、楽天API呼び出しのたびに record() する
 * - リクエスト末尾で drain() して KV へフラッシュする
 * - Cloudflare 依存なし（テスト容易性・ユニットテストで exercising するため）
 * - プライバシー配慮: キーワードは DJB2 ハッシュ化して保存
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** 計測結果の型 */
export type RakutenPerfEntry = {
  timestamp: string;
  keywordHash: string;
  durationMs: number;
  httpStatus: number;
  productCount: number;
  cacheHit: boolean;
  error?: string;
};

/** 計測結果の集計サマリー */
export type RakutenPerfSummary = {
  period: { from: string; to: string };
  totalRequests: number;
  cacheHits: number;
  cacheHitRate: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  maxDurationMs: number;
  minDurationMs: number;
  successCount: number;
  errorCount: number;
  errorRate: number;
  timeoutCount: number;
  avgProductCount: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** KV キープレフィックス */
export const PERF_KV_PREFIX = "rakuten-perf:";

/** KV エントリ保持期間（7日） */
export const PERF_KV_TTL_SECONDS = 7 * 24 * 60 * 60;

/** バッファ上限（1リクエストあたり） */
export const BUFFER_MAX_SIZE = 256;

// ─── Hashing ──────────────────────────────────────────────────────────────────

/**
 * キーワードを DJB2 ハッシュ化して16文字の16進文字列を返す。
 * 2つの DJB2 変種（初期値 5381 と 52711）を組み合わせて128bit 分を生成。
 * 非同期版SHA-256より高速で、プライバシー目的には十分な強度。
 */
export function hashKeywordSync(keyword: string): string {
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < keyword.length; i++) {
    const c = keyword.charCodeAt(i);
    h1 = ((h1 << 5) + h1 + c) | 0;
    h2 = ((h2 << 5) + h2 + c) | 0;
  }
  const a = (h1 >>> 0).toString(16).padStart(8, "0");
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  return (a + b).slice(0, 16);
}

// ─── Collector (request-scoped) ───────────────────────────────────────────────

/**
 * リクエストスコープのパフォーマンスコレクタ。
 *
 * 使用法（Cloudflare Pages Function 内）:
 * ```ts
 * const collector = new RakutenPerfCollector();
 * collector.record({ keywordHash, durationMs, httpStatus, productCount, cacheHit });
 * // リクエスト末尾で drain して KV へ保存
 * const entries = collector.drain();
 * await flushEntriesToKV(kv, entries);
 * ```
 */
export class RakutenPerfCollector {
  private buffer: RakutenPerfEntry[] = [];

  /**
   * エントリを記録（失敗は無視）。
   * @param _testTimestamp テスト用のタイムスタンプ上書き（本番では未指定 = Date.now()）
   */
  record(
    entry: Omit<RakutenPerfEntry, "timestamp">,
    _testTimestamp?: string,
  ): void {
    try {
      this.buffer.push({
        ...entry,
        timestamp: _testTimestamp ?? new Date().toISOString(),
      });
      if (this.buffer.length > BUFFER_MAX_SIZE) {
        this.buffer = this.buffer.slice(-BUFFER_MAX_SIZE);
      }
    } catch {
      // 計測失敗は無視（API処理に影響しない）
    }
  }

  /** バッファのエントリを返してクリアする */
  drain(): RakutenPerfEntry[] {
    const entries = this.buffer;
    this.buffer = [];
    return entries;
  }

  /** 現在のバッファサイズ */
  get size(): number {
    return this.buffer.length;
  }
}

// ─── Module-level Collector (auto-wired) ──────────────────────────────────────

let collector = new RakutenPerfCollector();

/** 現在のモジュールレベルコレクタにエントリを記録する（shorthand） */
export function recordPerfEntry(
  entry: Omit<RakutenPerfEntry, "timestamp">,
  _testTimestamp?: string,
): void {
  collector.record(entry, _testTimestamp);
}

/**
 * モジュールレベルコレクタを drain してエントリを返す。
 * Worker のリクエスト末尾で呼んでから flushEntriesToKV に渡す。
 */
export function drainPerfEntries(): RakutenPerfEntry[] {
  return collector.drain();
}

/** コレクタを置き換える（テスト用） */
export function resetPerfCollectorForTests(): void {
  collector = new RakutenPerfCollector();
}

// ─── KV Persistence ───────────────────────────────────────────────────────────

/** Cloudflare KV バインディングの最小インターフェース */
export interface PerfKV {
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

/**
 * エントリ配列を KV に保存する。
 * キーは `{PREFIX}{timestamp}` の形式。エントリが空なら何もしない。
 * 保存失敗はログを出して続行（fail-safe）。
 */
export async function flushEntriesToKV(
  kv: PerfKV,
  entries: readonly RakutenPerfEntry[],
): Promise<number> {
  if (entries.length === 0) return 0;
  try {
    await Promise.all(
      entries.map((entry) =>
        kv.put(`${PERF_KV_PREFIX}${entry.timestamp}`, JSON.stringify(entry), {
          expirationTtl: PERF_KV_TTL_SECONDS,
        }),
      ),
    );
    return entries.length;
  } catch {
    console.error("楽天APIパフォーマンスログの保存に失敗しました");
    return 0;
  }
}

// ─── Summary Computation ──────────────────────────────────────────────────────

/** エントリ配列からサマリーを計算（純粋関数） */
export function computeSummary(
  entries: readonly RakutenPerfEntry[],
): RakutenPerfSummary {
  const empty: RakutenPerfSummary = {
    period: { from: "", to: "" },
    totalRequests: 0,
    cacheHits: 0,
    cacheHitRate: 0,
    avgDurationMs: 0,
    p50DurationMs: 0,
    p95DurationMs: 0,
    p99DurationMs: 0,
    maxDurationMs: 0,
    minDurationMs: 0,
    successCount: 0,
    errorCount: 0,
    errorRate: 0,
    timeoutCount: 0,
    avgProductCount: 0,
  };
  if (entries.length === 0) return empty;

  const sorted = [...entries].sort((a, b) => a.durationMs - b.durationMs);
  const apiEntries = sorted.filter((e) => !e.cacheHit);
  const durations =
    apiEntries.length > 0
      ? apiEntries.map((e) => e.durationMs)
      : sorted.map((e) => e.durationMs);

  const percentile = (p: number): number => {
    if (durations.length === 0) return 0;
    const idx = Math.ceil((p / 100) * durations.length) - 1;
    return durations[Math.max(0, idx)];
  };

  const successCount = entries.filter((e) => e.httpStatus === 200).length;
  const timeoutCount = entries.filter(
    (e) => e.error?.includes("timeout") || e.error?.includes("abort"),
  ).length;
  const cacheHits = entries.filter((e) => e.cacheHit).length;

  return {
    period: {
      from: entries[0].timestamp,
      to: entries[entries.length - 1].timestamp,
    },
    totalRequests: entries.length,
    cacheHits,
    cacheHitRate: cacheHits / entries.length,
    avgDurationMs:
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
    p50DurationMs: percentile(50),
    p95DurationMs: percentile(95),
    p99DurationMs: percentile(99),
    maxDurationMs: durations[durations.length - 1] ?? 0,
    minDurationMs: durations[0] ?? 0,
    successCount,
    errorCount: entries.length - successCount,
    errorRate: (entries.length - successCount) / entries.length,
    timeoutCount,
    avgProductCount: Math.round(
      entries.reduce((a, e) => a + e.productCount, 0) / entries.length,
    ),
  };
}
