// Pages Functions 間で共用する小さなヘルパー。
// 各 Function ファイルは独立にバンドルされるため、依存は軽量に保つ。

const RATE_LIMIT_FALLBACK_RETRY_SECONDS = 60;

export type RateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
      reason?: "rate-limited" | "unavailable";
    };

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

export function json(
  data: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

/**
 * 同一キー（例: 同一IP）からの連続リクエストを制限する。
 * レート制限カウンタは Cloudflare ロケーション単位・結果整合性（permissive）のため、
 * 厳密な会計ではなくスパム抑止として使う。バインディングが無い・失敗する場合は
 * 制限なしで続行する（可用性優先。楽天APIのフォールバック方針と同じ）。
 */
export async function enforceRateLimit(
  limiter: ContactRateLimiter | undefined,
  key: string,
  label: string,
  options: { failClosed?: boolean } = {},
): Promise<RateLimitResult> {
  const failClosed = options.failClosed ?? false;
  if (!limiter) {
    if (failClosed) {
      console.error(
        `${label}: レート制限バインディング未設定。fail-closed で 503 を返します`,
      );
      return { allowed: false, retryAfterSeconds: 60, reason: "unavailable" };
    }
    console.warn(
      `${label}: レート制限バインディング未設定のため制限なしで続行します`,
    );
    return { allowed: true };
  }
  try {
    const result = await limiter.limit({ key });
    if (result.success) return { allowed: true };
    const retryAfterSeconds =
      typeof result.reset_after === "number" && result.reset_after > 0
        ? result.reset_after
        : RATE_LIMIT_FALLBACK_RETRY_SECONDS;
    return { allowed: false, retryAfterSeconds, reason: "rate-limited" };
  } catch (error) {
    if (failClosed) {
      console.error(
        `${label}: レート制限API エラー。fail-closed で 503 を返します`,
        error,
      );
      return { allowed: false, retryAfterSeconds: 60, reason: "unavailable" };
    }
    console.warn(`${label}: エラーのため制限なしで続行します`, error);
    return { allowed: true };
  }
}
