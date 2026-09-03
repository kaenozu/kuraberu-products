// Cloudflare Pages Function: 楽天API パフォーマンスログ
// GET /api/rakuten-perf — 直近N時間のパフォーマンスサマリーを返す
//
// rakuten.ts が API 呼び出しのたびに recordPerfEntry() でエントリを蓄積し、
// Worker がこのエンドポイントを呼ぶときに drainPerfEntries() で取り出して
// flushEntriesToKV() で KV へ保存する。

import { clientIp, enforceRateLimit, isSameSiteOrigin, json } from "./shared";
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
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
  get(key: string, options?: { type: "json" }): Promise<unknown>;
}

// ─── POST Handler: drain + flush ──────────────────────────────────────────────

/** POST /api/rakuten-perf — コレクタを drain して KV へ保存する
 *
 * 公開 POST だと KV 書き込み枠の浪費・偽 perf metrics の混入が起きるため、
 * 共有シークレット + Origin 検証で保護する。
 * シークレットは `RAKUTEN_PERF_FLUSH_TOKEN` 環境変数 (Cloudflare secret) に
 * 設定する。未設定・不一致・Origin 不正は 403 で fail-closed。
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get("Origin") ?? "";
  const siteUrl = env.PUBLIC_SITE_URL ?? "https://kuraberu-products.pages.dev";
  if (!isSameSiteOrigin(origin, siteUrl)) {
    return json({ ok: false, error: "invalid origin" }, 403);
  }

  const expected = env.RAKUTEN_PERF_FLUSH_TOKEN;
  if (!expected) {
    console.error(
      "rakuten-perf: RAKUTEN_PERF_FLUSH_TOKEN 未設定のため fail-closed で 403 を返します",
    );
    return json({ ok: false, error: "forbidden" }, 403);
  }
  const presented = request.headers.get("X-Perf-Flush-Token") ?? "";
  if (!constantTimeEquals(presented, expected)) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const kv = env.ANALYTICS_KV as unknown as PerfKV | undefined;
  if (!kv) {
    return json({ ok: false, error: "KV not configured" }, 503);
  }

  const entries = drainPerfEntries();
  if (entries.length === 0) {
    return json({ ok: true, saved: 0 }, 200);
  }

  const saved = await flushEntriesToKV(kv, entries);
  return json({ ok: true, saved }, 200);
};

/**
 * トークン比較をタイミング攻撃に対して安全に行う。
 * 長さが異なる場合は早期に false を返しつつ、長さは公開情報ではないため
 * 長さ差から内容差が推測されないよう、常に全体比較する。
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

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
