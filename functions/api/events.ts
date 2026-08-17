// Cloudflare Pages Function: プライバシー配慮型クリック計測の受信口
// POST /api/events — 購入CTAクリックを同一オリジンから受け取り、任意で KV に保存する。
//
// プライバシー設計:
// - 保存するのはイベント種別・商品ID・配置（placement）・ページパスのみ
// - Cookie・フィンガープリント・IP は収集・保存しない（IP はレート制限の判定に一時使用するだけ）
// - 第三者ドメインへの送信は一切行わない（すべて同一オリジン）
// - KV 未設定・障害時はイベントを破棄して 204 を返し続ける（計測はサイト体験の可用性より劣後）
import { clientIp, enforceRateLimit, json } from "./shared";
import { isSameSiteOrigin } from "./contact";
import { ARTICLE_LAYOUT } from "../../config/article-layout.mjs";

const MAX_BODY_BYTES = 4096;
const KV_TTL_SECONDS = 90 * 24 * 60 * 60; // 90日

interface AnalyticsEvent {
  event?: string;
  productId?: string;
  placement?: string;
  path?: string;
  rank?: string;
}

function isValidProductId(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(value);
}

function isValidPath(value: string): boolean {
  if (value.length > 200) return false;
  if (!value.startsWith("/")) return false;
  return !/[\u0000-\u001f\u007f]/.test(value);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 送信元チェック（同一オリジンからのみ。Origin 完全一致）
  const origin = request.headers.get("Origin") ?? "";
  const siteUrl = env.PUBLIC_SITE_URL ?? "https://kuraberu-products.pages.dev";
  if (!isSameSiteOrigin(origin, siteUrl)) {
    return json({ ok: false, error: "invalid origin" }, 403);
  }

  // 同一IPからの連続送信を制限する（例: 1分あたり60件）。
  const rate = await enforceRateLimit(
    env.ANALYTICS_RATE_LIMITER,
    `kuraberu-events:${clientIp(request)}`,
    "クリック計測レート制限",
  );
  if (!rate.allowed) {
    return json({ ok: false, error: "too many requests" }, 429, {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  // サイズ上限と JSON パース
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "payload too large" }, 413);
  }
  let body: AnalyticsEvent;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "invalid json" }, 400);
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ ok: false, error: "invalid payload" }, 400);
  }

  // イベント名は config/article-layout.mjs の CTA マーカー値と一致するものだけ許可
  const event = typeof body.event === "string" ? body.event : "";
  if (event !== ARTICLE_LAYOUT.ctaEvent) {
    return json({ ok: false, error: "unknown event" }, 400);
  }

  // 配置は config の許可リストで検証（レイアウト変更時は config だけを直す）。
  // 診断結果カード（placement=diagnosis-result）も、記事と同じイベント種別で受け付ける。
  const placement = typeof body.placement === "string" ? body.placement : "";
  const allowedPlacements = [
    ...ARTICLE_LAYOUT.placements,
    ARTICLE_LAYOUT.diagnosisPlacement,
  ];
  if (!allowedPlacements.includes(placement)) {
    return json({ ok: false, error: "invalid placement" }, 400);
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  if (productId && !isValidProductId(productId)) {
    return json({ ok: false, error: "invalid product id" }, 400);
  }

  // 診断結果の順位（rank）は任意。無ければ保存しない。
  const rank =
    typeof body.rank === "string" && /^[1-9]\d{0,2}$/.test(body.rank)
      ? body.rank
      : undefined;

  const path = typeof body.path === "string" ? body.path : "";
  if (path && !isValidPath(path)) {
    return json({ ok: false, error: "invalid path" }, 400);
  }

  // 保存（任意）: 日別キー + UUID の追記型で読み書き競合を避け、IP などは含めない。
  const kv = env.ANALYTICS_KV;
  if (kv) {
    const day = new Date().toISOString().slice(0, 10);
    const key = `v1:events:${day}:${crypto.randomUUID()}`;
    const value = JSON.stringify({
      event,
      ...(productId ? { productId } : {}),
      placement,
      ...(rank ? { rank } : {}),
      ...(path ? { path } : {}),
      at: new Date().toISOString(),
    });
    try {
      await kv.put(key, value, { expirationTtl: KV_TTL_SECONDS });
    } catch (error) {
      console.warn(
        "クリック計測: ANALYTICS_KV への保存に失敗したためイベントを破棄します",
        error,
      );
    }
  }

  return new Response(null, { status: 204 });
};
