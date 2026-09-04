// Cloudflare Pages Function: 楽天API パフォーマンスログ
// GET /api/rakuten-perf — 直近N時間のパフォーマンスサマリーを返す
//
// rakuten.ts が API 呼び出しのたびに recordPerfEntry() でエントリを蓄積する。
// 現在、リポジトリ内に正規の server-side flush caller は存在しないため、
// 公開 POST から共有 KV へ書き込む経路は fail-closed で無効化する。

import { clientIp, enforceRateLimit, json } from "./shared";
import {
  computeSummary,
  PERF_KV_PREFIX,
  type RakutenPerfEntry,
} from "../../src/lib/rakuten-perf";

// ─── KV Helpers ───────────────────────────────────────────────────────────────

/** Cloudflare KV バインディングの最小インターフェース */
interface PerfKV {
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
  get(key: string, options?: { type: "json" }): Promise<unknown>;
}

// ─── POST Handler ──────────────────────────────────────────────────────────────

/**
 * POST /api/rakuten-perf — disabled until a legitimate server-side caller exists.
 *
 * Keeping an unauthenticated public write endpoint would allow arbitrary callers
 * to drain the in-memory collector and consume shared KV writes. Introducing a
 * shared secret without a real caller would only add secret lifecycle and a
 * deployment dependency. Re-enable POST only together with a documented
 * server-to-server caller and its authentication/injection path.
 */
export const onRequestPost: PagesFunction<Env> = async () =>
  json({ ok: false, error: "method not allowed" }, 405, {
    Allow: "GET",
  });

// ─── GET Handler: read from KV + summary ──────────────────────────────────────

/** GET /api/rakuten-perf — 直近N時間のサマリーを返す */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const rate = await enforceRateLimit(
    env.ANALYTICS_RATE_LIMITER,
    `rakuten-perf:${clientIp(request)}`,
    "楽天APIパフォーマンスログ",
  );
  if (!rate.allowed) {
    return json({ ok: false, error: "too many requests" }, 429, {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  const kv = env.ANALYTICS_KV as unknown as PerfKV | undefined;
  if (!kv) {
    return json({ ok: false, error: "KV not configured" }, 503);
  }

  try {
    const url = new URL(request.url);
    const hours = parseInt(url.searchParams.get("hours") ?? "24", 10);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const list = await kv.list({ prefix: PERF_KV_PREFIX });
    const entries: RakutenPerfEntry[] = [];

    for (const key of list.keys) {
      if (key.name < `${PERF_KV_PREFIX}${cutoff}`) continue;
      const value = await kv.get(key.name, { type: "json" });
      if (value) entries.push(value as RakutenPerfEntry);
    }

    entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const summary = computeSummary(entries);

    return json(
      {
        ok: true,
        summary,
        entryCount: entries.length,
        query: { hours },
      },
      200,
    );
  } catch (error) {
    console.error("楽天APIパフォーマンスログの取得に失敗しました", error);
    return json({ ok: false, error: "failed to read logs" }, 500);
  }
};
