// Cloudflare Pages Function: お問い合わせフォーム → Telegram 転送
// POST /api/contact で name / email / message を受け取り、
// 管理用 Telegram bot に転送する。

// 同一IPからの連続送信を制限する（Workers Rate Limiting API）。
// バインディング未設定・エラー時は制限なしで続行する（可用性を優先。
// 楽天APIのフォールバック方針と同じく、外部依存の障害でエンドポイントを止めない）。
const RATE_LIMIT_FALLBACK_RETRY_SECONDS = 60;

interface ContactBody {
  name?: string;
  email?: string;
  message?: string;
}

/**
 * Origin ヘッダーが許可されたサイトのオリジンと完全一致するかを判定する。
 * 前方一致ではなく origin（scheme + host + port）の完全比較を行うため、
 * `https://kuraberu-products.pages.dev.evil.com` のような偽装オリジンは
 * 許可しない。Origin が無いリクエスト（curl・サーバー間呼び出しなど）は
 * 従来どおり許可する。
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
 * クライアントIPを取り出す。Cloudflare 経由の CF-Connecting-IP を優先し、
 * フォールバックは X-Forwarded-For の先頭を使う。
 */
export function clientIp(request: Request): string {
  const direct = request.headers.get("CF-Connecting-IP");
  if (direct) return direct;
  const forwarded = request.headers.get("X-Forwarded-For");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "unknown";
}

export type ContactRateLimitResult =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * 同一IPからの連続送信を制限する。
 * レート制限カウンタは Cloudflare ロケーション単位・結果整合性（permissive）のため、
 * 厳密な会計ではなくスパム抑止として使う。バインディングが無い・失敗する場合は
 * 制限なしで続行する。
 */
export async function enforceContactRateLimit(
  limiter: ContactRateLimiter | undefined,
  ip: string,
): Promise<ContactRateLimitResult> {
  if (!limiter) {
    console.warn(
      "お問い合わせレート制限: CONTACT_RATE_LIMITER バインディング未設定のため制限なしで続行します",
    );
    return { allowed: true };
  }
  try {
    const result = await limiter.limit({ key: `kuraberu-contact:${ip}` });
    if (result.success) return { allowed: true };
    const retryAfterSeconds =
      typeof result.reset_after === "number" && result.reset_after > 0
        ? result.reset_after
        : RATE_LIMIT_FALLBACK_RETRY_SECONDS;
    return { allowed: false, retryAfterSeconds };
  } catch (error) {
    console.warn(
      "お問い合わせレート制限: エラーのため制限なしで続行します",
      error,
    );
    return { allowed: true };
  }
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

  const tgRes = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: Number(chatId),
        text,
        disable_web_page_preview: true,
      }),
    },
  );

  if (!tgRes.ok) {
    const detail = await tgRes.text().catch(() => "");
    console.error("telegram send failed:", tgRes.status, detail.slice(0, 200));
    return json({ ok: false, error: "delivery failed" }, 502);
  }

  return json({ ok: true }, 200);
};

function json(
  data: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}
