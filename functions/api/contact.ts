// Cloudflare Pages Function: お問い合わせフォーム → Telegram 転送
// POST /api/contact で name / email / message を受け取り、
// 管理用 Telegram bot に転送する。
//
// 共通ヘルパー（clientIp / json / enforceRateLimit）は ./shared を使う。
import { clientIp, enforceRateLimit, json } from "./shared";
import type { RateLimitResult } from "./shared";

export { clientIp } from "./shared";

interface ContactBody {
  name?: string;
  email?: string;
  message?: string;
}

/**
 * Origin ヘッダーが許可されたサイトのオリジンと完全一致するかを判定する。
 * 前方一致ではなく origin（scheme + host + port）の完全比較を行うため、
 * `https://kuraberu-products.pages.dev.evil.com` のような偽装オリジンは
 * 許可しない。
 *
 * 注意: これはCSRF対策の完全な代替ではない。Origin が無いリクエスト
 * （curl・サーバー間呼び出し・一部の旧クライアント）は意図的に許可する
 * ため、非ブラウザクライアントからの偽装は防げない。ブラウザ由来の
 * クロスサイト送信は Origin を必ず付けるため、実質的にはブラウザ経由の
 * 不正送信を拒否する役割を担う。
 */
export function isSameSiteOrigin(
  originHeader: string | null,
  siteUrl: string,
): boolean {
  if (!originHeader) return true;
  let origin: URL;
  let expected: URL;
  try {
    origin = new URL(originHeader);
    expected = new URL(siteUrl);
  } catch {
    return false;
  }
  return origin.origin === expected.origin;
}

/**
 * 同一IPからの連続送信を制限する（例: 1分あたり5件）。
 * バインディング未設定・エラー時は制限なしで続行する。
 */
export async function enforceContactRateLimit(
  limiter: ContactRateLimiter | undefined,
  ip: string,
): Promise<RateLimitResult> {
  return enforceRateLimit(
    limiter,
    `kuraberu-contact:${ip}`,
    "お問い合わせレート制限",
  );
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 送信元チェック（同一オリジンからのみ。Origin 完全一致）
  const origin = request.headers.get("Origin") ?? "";
  const siteUrl = env.PUBLIC_SITE_URL ?? "https://kuraberu-products.pages.dev";
  if (!isSameSiteOrigin(origin, siteUrl)) {
    return json({ ok: false, error: "invalid origin" }, 403);
  }

  // 同一IPからの連続送信を制限する（例: 1分あたり5件）。
  const rate = await enforceContactRateLimit(
    env.CONTACT_RATE_LIMITER,
    clientIp(request),
  );
  if (!rate.allowed) {
    return json({ ok: false, error: "too many requests" }, 429, {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  // Content-Type チェック
  const contentType = request.headers.get("Content-Type") ?? "";
  if (
    !contentType.includes("application/x-www-form-urlencoded") &&
    !contentType.includes("multipart/form-data")
  ) {
    return json({ ok: false, error: "invalid content type" }, 415);
  }

  // 本文サイズの事前チェック（formData展開前に確認）。
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (contentLength > 10_000) {
    return json({ ok: false, error: "payload too large" }, 413);
  }

  const form = await request.formData();
  const body: ContactBody = {
    name: String(form.get("name") ?? "")
      .trim()
      .slice(0, 80),
    email: String(form.get("email") ?? "")
      .trim()
      .slice(0, 120),
    message: String(form.get("message") ?? "")
      .trim()
      .slice(0, 4000),
  };

  if (!body.message || !body.email) {
    return json({ ok: false, error: "message and email are required" }, 400);
  }

  // メールアドレスの簡易形式チェック（必須化に伴い形式も検証）
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return json({ ok: false, error: "invalid email" }, 400);
  }

  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return json({ ok: false, error: "server not configured" }, 500);
  }

  // 簡単なスパム防止: メッセージに URL が多すぎる場合は拒否
  const urlCount = (body.message.match(/https?:\/\//g) ?? []).length;
  if (urlCount > 5) {
    return json({ ok: false, error: "too many urls" }, 400);
  }

  const text = [
    "📩 お問い合わせ（くらべる商品メモ）",
    "",
    `名前: ${body.name || "（未記入）"}`,
    `返信先メール: ${body.email}`,
    "",
    "---",
    body.message,
  ].join("\n");

  const tgController = new AbortController();
  const tgTimeout = setTimeout(() => tgController.abort(), 5_000);
  let tgRes: Response;
  try {
    tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: Number(chatId),
        text,
        disable_web_page_preview: true,
      }),
      signal: tgController.signal,
    });
  } catch {
    return json({ ok: false, error: "delivery timeout" }, 504);
  } finally {
    clearTimeout(tgTimeout);
  }

  if (!tgRes.ok) {
    const detail = await tgRes.text().catch(() => "");
    console.error("telegram send failed:", tgRes.status, detail.slice(0, 200));
    return json({ ok: false, error: "delivery failed" }, 502);
  }

  return json({ ok: true }, 200);
};
