// Cloudflare Pages Function: お問い合わせフォーム → Telegram 転送
// POST /api/contact で name / email / message を受け取り、
// 管理用 Telegram bot に転送する。

interface ContactBody {
  name?: string;
  email?: string;
  message?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 送信元チェック（同一オリジンからのみ）
  const origin = request.headers.get("Origin") ?? "";
  const siteUrl = env.PUBLIC_SITE_URL ?? "https://kuraberu-products.pages.dev";
  if (origin && !origin.startsWith(siteUrl.replace(/\/$/, ""))) {
    return json({ ok: false, error: "invalid origin" }, 403);
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

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
