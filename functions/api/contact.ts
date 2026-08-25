// Cloudflare Pages Function: お問い合わせフォーム → Telegram 転送
// POST /api/contact で name / email / message を受け取り、
// 管理用 Telegram bot に転送する。
//
// 共通ヘルパー（clientIp / json / enforceRateLimit）は ./shared を使う。
import { clientIp, enforceRateLimit, isSameSiteOrigin, json } from "./shared";
import type { RateLimitResult } from "./shared";

export { clientIp, isSameSiteOrigin } from "./shared";

interface ContactBody {
  name?: string;
  email?: string;
  message?: string;
}

/**
 * 同一IPからの連続送信を制限する（例: 1分あたり5件）。
 * バインディング未設定・エラー時は 503 を返す（fail-closed）。
 */
export async function enforceContactRateLimit(
  limiter: ContactRateLimiter | undefined,
  ip: string,
): Promise<RateLimitResult> {
  return enforceRateLimit(
    limiter,
    `kuraberu-contact:${ip}`,
    "お問い合わせレート制限",
    { failClosed: true },
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
    if (rate.reason === "unavailable") {
      return json({ ok: false, error: "rate limiter unavailable" }, 503);
    }
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

  // Content-Length の有無に関わらず、受け入れる body を上限付きで処理する。
  // Content-Length が無い・不正確な request でも安全に保護する。
  const MAX_BODY_BYTES = 10_000;
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "payload too large" }, 413);
  }

  // formData() 展開後の実サイズを確認（Content-Length 欠落・過少申告対策）。
  const form = await request.formData();
  const rawMessage = String(form.get("message") ?? "").trim();
  const rawName = String(form.get("name") ?? "").trim();
  const rawEmail = String(form.get("email") ?? "").trim();
  // UTF-16 の .length ではなく TextEncoder でバイト数を測る。多バイト文字
  //（日本語など）では .length < 実バイト数になるため、文字数ベースの判定は
  // 上限を超過許容してしまう。フィールド名も含めて実ペイロードに近い値で比較する。
  const encoder = new TextEncoder();
  const formFields: ReadonlyArray<readonly [string, string]> = [
    ["message", rawMessage],
    ["name", rawName],
    ["email", rawEmail],
  ];
  let totalSize = 0;
  for (const [field, value] of formFields) {
    totalSize += encoder.encode(field).length + encoder.encode(value).length;
  }
  if (totalSize > MAX_BODY_BYTES) {
    return json({ ok: false, error: "payload too large" }, 413);
  }

  const body: ContactBody = {
    name: rawName.slice(0, 80),
    email: rawEmail.slice(0, 120),
    message: rawMessage.slice(0, 4000),
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
