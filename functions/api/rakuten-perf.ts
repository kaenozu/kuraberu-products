// Cloudflare Pages Function: 楽天API パフォーマンスログ
// GET /api/rakuten-perf — 直近N時間のパフォーマンスサマリーを返す
//
// rakuten.ts が API 呼び出しのたびに recordPerfEntry() でエントリを蓄積し、
// Worker がこのエンドポイントを呼ぶときに drainPerfEntries() で取り出して
// flushEntriesToKV() で KV へ保存する。

import { clientIp, enforceRateLimit, json } from "./shared";
import {
  computeSummary,
  drainPerfEntries,
  flushEntriesToKV,
  PERF_KV_PREFIX,
  type RakutenPerfEntry,
} from "../../src/lib/rakuten-perf";

// ─── KV Helpers ───────────────────────────────────────────────────────────────

/** Cloudflare KV バインディングの最小インターフェース */
interface PerfKV {
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
  get(key: string, options?: { type: "json" }): Promise<unknown>;
}

// ─── POST Handler: drain + flush ──────────────────────────────────────────────

/** POST /api/rakuten-perf — コレクタを drain して KV へ保存する */
export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  const kv = env.ANALYTICS_KV as unknown as PerfKV | undefined;
  if (!kv) {
    return json({ ok: false, error: "KV not configured" }, 503);
  }

  const entries = drainPerfEntries();
  if (entries.length === 0) {
    return json({ ok: true, saved: 0 });
  }

  const saved = await flushEntriesToKV(kv, entries);
  return json({ ok: true, saved });
};

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

    return json({ ok: true, summary, entryCount: entries.length, query: { hours } });
  } catch (error) {
    console.error("楽天APIパフォーマンスログの取得に失敗しました", error);
    return json({ ok: false, error: "failed to read logs" }, 500);
  }
};
